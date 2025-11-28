import { desc, eq } from "@arkiv-network/sdk/query";
import { createArkivClients } from "./wallet";
import { jsonToPayload, ExpirationTime } from "@arkiv-network/sdk/utils";

export interface Sketch {
	id: string;
	timestamp: number;
	imageData: string;
}

export async function loadSketches(userAddress: string): Promise<Sketch[]> {
	try {
		const { publicClient } = createArkivClients();

		const result = await publicClient
			.buildQuery()
			.where(eq("type", "sketch")) // our custom attribute we set when saving
			.ownedBy(userAddress as `0x${string}`) // only sketches owned by the user
			.orderBy(desc("timestamp", "number")) // order by timestamp - another custom attribute we set
			.withPayload(true)
			.limit(9)
			.fetch();

		const sketches = result.entities
			.map((entity) => {
				try {
					const payload = entity.toJson();
					if (payload?.imageData) {
						return {
							id: entity.key,
							timestamp: payload.timestamp || 0,
							imageData: payload.imageData,
						} as Sketch;
					}
					return null;
				} catch {
					return null;
				}
			})
			.filter((s): s is Sketch => s !== null)
			.sort((a, b) => b.timestamp - a.timestamp);

		return sketches;
	} catch (error) {
		console.error("Failed to load sketches:", error);
		return [];
	}
}

export async function saveSketch(
	imageData: string,
	userAddress: string,
): Promise<string> {
	const { walletClient } = createArkivClients(userAddress as `0x${string}`);

	const { entityKey } = await walletClient.createEntity({
		payload: jsonToPayload({
			imageData,
			timestamp: Date.now(),
		}),
		contentType: "application/json",
		attributes: [
			{ key: "type", value: "sketch" }, // custom attribute to identify which entities are sketches
			{ key: "timestamp", value: Date.now() }, // we will sort by this timestamp later
		],
		expiresIn: ExpirationTime.fromDays(365),
	});

	return entityKey;
}
