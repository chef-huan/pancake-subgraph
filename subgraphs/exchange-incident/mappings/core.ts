/* eslint-disable prefer-const  */
import { Burn, Mint, Transfer } from "../generated/templates/Pair/Pair";
import { getOrCreateTransaction, getOrCreateUser, getUserIfProxy, ZERO_BI } from "./utils";
import { Address, BigInt } from "@graphprotocol/graph-ts";
import { Mint as MintEvent } from "../generated/schema";

let ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";
let MASTER_CHEF_V2 = "0xa5f8c5dbd5f286960b9d90548680ae5ebff07652";

function isCompleteMint(mintId: string): boolean {
  return MintEvent.load(mintId).sender !== null; // sufficient checks
}

export function handleTransfer(event: Transfer): void {
  // Initial liquidity.
  if (Address.fromString(ADDRESS_ZERO).equals(event.params.to) && event.params.value.equals(BigInt.fromI32(1000))) {
    return;
  }

  let transaction = getOrCreateTransaction(event.transaction.hash.toHex(), event.block.number, event.block.timestamp);

  if (Address.fromString(ADDRESS_ZERO).equals(event.params.from)) {
    let toUserAddress = getUserIfProxy(event.params.to);

    let user = getOrCreateUser(toUserAddress);
    user.lpNotStacked = user.lpNotStacked.plus(event.params.value);
    user.lpTotal = user.lpTotal.plus(event.params.value);
    user.lastEvent = "Mint";
    user.lastTx = event.transaction.hash;
    user.save();

    let mints = transaction.mints;
    if (mints.length === 0 || isCompleteMint(mints[mints.length - 1])) {
      let mint = new MintEvent(
        event.transaction.hash.toHex().concat("-").concat(BigInt.fromI32(mints.length).toString())
      );
      mint.transaction = transaction.id;
      mint.to = toUserAddress;
      mint.liquidity = event.params.value;
      mint.timestamp = transaction.timestamp;
      mint.transaction = transaction.id;
      mint.save();

      // update mints in transaction
      transaction.mints = mints.concat([mint.id]);
    }
  } else if (Address.fromString(ADDRESS_ZERO).equals(event.params.to)) {
    let fromUserAddress = getUserIfProxy(event.params.from);

    let user = getOrCreateUser(fromUserAddress);
    user.lpNotStacked = user.lpNotStacked.minus(event.params.value);
    user.lpTotal = user.lpTotal.minus(event.params.value);
    user.lastEvent = "Burn";
    user.lastTx = event.transaction.hash;
    user.save();
  } else if (Address.fromString(MASTER_CHEF_V2).equals(event.params.to)) {
    let fromUserAddress = getUserIfProxy(event.params.from);

    let userFrom = getOrCreateUser(fromUserAddress);

    userFrom.lpNotStacked = userFrom.lpNotStacked.minus(event.params.value);
    userFrom.lpStacked = userFrom.lpStacked.plus(event.params.value);

    userFrom.lastEvent = "Stack";
    userFrom.lastTx = event.transaction.hash;
    if (userFrom.startStackedTimestamp.equals(ZERO_BI)) {
      userFrom.startStackedTimestamp = event.block.timestamp;
    }

    userFrom.save();
  } else if (Address.fromString(MASTER_CHEF_V2).equals(event.params.from)) {
    let toUserAddress = getUserIfProxy(event.params.to);

    let userTo = getOrCreateUser(toUserAddress);

    userTo.lpNotStacked = userTo.lpNotStacked.plus(event.params.value);
    userTo.lpStacked = userTo.lpStacked.minus(event.params.value);

    userTo.lastEvent = "UnStack";
    userTo.lastTx = event.transaction.hash;

    if (userTo.lpStacked.le(ZERO_BI)) {
      userTo.startStackedTimestamp = ZERO_BI;
    }
    userTo.endStackedTimestamp = event.block.timestamp;

    userTo.save();
  } else {
    let fromUserAddress = getUserIfProxy(event.params.from);
    let toUserAddress = getUserIfProxy(event.params.to);

    let userFrom = getOrCreateUser(fromUserAddress);
    let userTo = getOrCreateUser(toUserAddress);

    userFrom.lpNotStacked = userFrom.lpNotStacked.minus(event.params.value);
    userTo.lpNotStacked = userTo.lpNotStacked.plus(event.params.value);

    userFrom.lpTotal = userFrom.lpTotal.minus(event.params.value);
    userTo.lpTotal = userTo.lpTotal.plus(event.params.value);

    userFrom.lastEvent = "Transfer";
    userTo.lastEvent = "Transfer";
    userFrom.lastTx = event.transaction.hash;
    userTo.lastTx = event.transaction.hash;

    userFrom.save();
    userTo.save();
  }

  transaction.save();
}

export function handleMint(event: Mint): void {
  let transaction = getOrCreateTransaction(event.transaction.hash.toHex(), event.block.number, event.block.timestamp);
  let mints = transaction.mints;
  let mint = MintEvent.load(mints[mints.length - 1]);
  mint.sender = getUserIfProxy(event.params.sender);

  mint.save();

  let user = getOrCreateUser(Address.fromString(mint.to.toHex()));
  user.token0Amount = user.token0Amount.plus(event.params.amount0);
  user.token1Amount = user.token1Amount.plus(event.params.amount1);

  user.save();
}

export function handleBurn(event: Burn): void {
  let toUserAddress = getUserIfProxy(event.params.to);
  let user = getOrCreateUser(toUserAddress);
  user.token0Amount = user.token0Amount.minus(event.params.amount0);
  user.token1Amount = user.token1Amount.minus(event.params.amount1);

  user.save();
}
