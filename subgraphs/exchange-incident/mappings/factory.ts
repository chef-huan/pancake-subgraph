/* eslint-disable prefer-const */
import { Pair } from "../generated/schema";
import { Pair as PairTemplate } from "../generated/templates";
import { FarmBoots as FarmBootsTemplate } from "../generated/templates";
import { PairCreated } from "../generated/Factory/Factory";
import { fetchTokenSymbol, fetchTokenName } from "./utils";
import { Address } from "@graphprotocol/graph-ts";

let WBNB_ADDRESS = "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c";
let ANKR_ADDRESS = "0xe85afccdafbe7f2b096f268e31cce3da8da2990a";

export function handlePairCreated(event: PairCreated): void {
  if (
    Address.fromString(WBNB_ADDRESS).equals(event.params.token0) &&
    Address.fromString(ANKR_ADDRESS).equals(event.params.token1)
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
