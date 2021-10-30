const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "./.env") });

const ccxt = require("ccxt");
const axios = require("axios");

const tick = async (config, binanceClient) => {
	const { asset, base, spread, allocation } = config;
	const market = `${asset}/${base}`;

	const orders = await binanceClient.fetchOpenOrders(market);
	await Promise.all(orders.map(async (order) => await binanceClient.cancelOrder(order.id, market)));

	const results = await Promise.all([
		axios.get("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=eur"),
		axios.get("https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=eur"),
	]);
	const marketPrice = results[0].data.bitcoin.eur / results[1].data.tether.eur;

	const sellPrice = marketPrice * (1 + spread);
	const buyPrice = marketPrice * (1 - spread);
	const balances = await binanceClient.fetchBalance();
	const assetBalance = balances.free[asset];
	const baseBalance = balances.free[base];
	const sellVolume = assetBalance * allocation;
	const buyVolume = (baseBalance * allocation) / marketPrice;

	await binanceClient.createLimitSellOrder(market, sellVolume, sellPrice);
	await binanceClient.createLimitBuyOrder(market, buyVolume, buyPrice);

	console.log(`
        New tick for ${market}...
        Created limit sell order for ${sellVolume}@${sellPrice}
        Created limit buy order for ${buyVolume}@${buyPrice}
    `);
};

const run = () => {
	const config = {
		asset: "BTC",
		base: "USDT",
		allocation: 0.5,
		spread: 0.2,
		tickInterval: 5000,
	};
	const binanceClient = new ccxt.binance({
		apiKey: process.env.API_KEY,
		secret: process.env.API_SECRET,
	});
	tick(config, binanceClient);
	setInterval(tick, config.tickInterval, config, binanceClient);
};

run();
