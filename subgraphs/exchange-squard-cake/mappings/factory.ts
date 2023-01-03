/* eslint-disable prefer-const */
import { Pair } from "../generated/schema";
import { Pair as PairTemplate } from "../generated/templates";
import { FarmBoots as FarmBootsTemplate } from "../generated/templates";
import { PairCreated } from "../generated/Factory/Factory";
import { fetchTokenSymbol, fetchTokenName } from "./utils";
import { Address } from "@graphprotocol/graph-ts";

let CAKE_ADDRESS = "0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82";
let SQUARD_ADDRESS = "0x724a32dfff9769a0a0e1f0515c0012d1fb14c3bd";

export function handlePairCreated(event: PairCreated): void {
  if (
    Address.fromString(CAKE_ADDRESS).equals(event.params.token0) &&
    Address.fromString(SQUARD_ADDRESS).equals(event.params.token1)
  ) {
    let pair = new Pair(event.params.pair.toHex()) as Pair;
    pair.token0Name = fetchTokenName(event.params.token0);
    pair.token1Name = fetchTokenName(event.params.token1);

    pair.token0Symbol = fetchTokenSymbol(event.params.token0);
    pair.token1Symbol = fetchTokenSymbol(event.params.token1);

    pair.block = event.block.number;
    pair.timestamp = event.block.timestamp;
    pair.save();

    PairTemplate.create(event.params.pair);
    FarmBootsTemplate.create(Address.fromString("0xE4FAa3Ef5A9708C894435B0F39c2B440936A3A52"));
  }
}
