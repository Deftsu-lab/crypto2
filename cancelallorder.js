const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "./.env") });
const ccxt = require("ccxt");
const Cancel = async (config, binanceClient) => {
	const market = `${config.asset}/${config.base}`;

	const orders = await binanceClient.fetchOpenOrders(market);
	await Promise.all(orders.map(async (order) => await binanceClient.cancelOrder(order.id, market)));
};

const run = () => {
	const config = {
		asset: "BTC",
		base: "USDT",
		allocation: 0.5,
		spread: 0.1,
		tickInterval: 5000,
	};
	const binanceClient = new ccxt.binance({
		apiKey: process.env.API_KEY,
		secret: process.env.API_SECRET,
	});
	Cancel(config, binanceClient);
};

run();
