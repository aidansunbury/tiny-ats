import winston from "winston";

const logFormat = winston.format.printf((info) => {
	const date = new Intl.DateTimeFormat("en-US", {
		timeZone: "America/Los_Angeles",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: false,
	}).format(new Date());

	let message = info.message;
	if (info[Symbol.for("splat")]) {
		message +=
			" " +
			info[Symbol.for("splat")]
				.map((arg: any) =>
					typeof arg === "object" ? JSON.stringify(arg, null, 2) : arg,
				)
				.join(" ");
	}

	return `${date}-${info.level}: ${message}`;
});

export const logger = winston.createLogger({
	transports: [
		new winston.transports.Console({
			level: "debug", // lowest level to log so it can be overridden
			handleExceptions: true,
			format: winston.format.combine(
				winston.format.colorize(),
				winston.format.splat(),
				logFormat,
			),
		}),
	],
});
