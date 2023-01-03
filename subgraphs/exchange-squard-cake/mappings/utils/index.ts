/* eslint-disable prefer-const */
import { BigInt, Address } from "@graphprotocol/graph-ts";
import { ERC20 } from "../../generated/Factory/ERC20";
import { ERC20NameBytes } from "../../generated/Factory/ERC20NameBytes";
import { ERC20SymbolBytes } from "../../generated/Factory/ERC20SymbolBytes";
import { Transaction, User, UserProxy } from "../../generated/schema";

export let ZERO_BI = BigInt.fromI32(0);

export function isNullBnbValue(value: string): boolean {
  return value == "0x0000000000000000000000000000000000000000000000000000000000000001";
}

export function fetchTokenSymbol(tokenAddress: Address): string {
  let contract = ERC20.bind(tokenAddress);
  let contractSymbolBytes = ERC20SymbolBytes.bind(tokenAddress);

  let symbolValue = "unknown";
  let symbolResult = contract.try_symbol();
  if (symbolResult.reverted) {
    let symbolResultBytes = contractSymbolBytes.try_symbol();
    if (!symbolResultBytes.reverted) {
      if (!isNullBnbValue(symbolResultBytes.value.toHex())) {
        symbolValue = symbolResultBytes.value.toString();
      }
    }
  } else {
    symbolValue = symbolResult.value;
  }
  return symbolValue;
}

export function fetchTokenName(tokenAddress: Address): string {
  let contract = ERC20.bind(tokenAddress);
  let contractNameBytes = ERC20NameBytes.bind(tokenAddress);

  let nameValue = "unknown";
  let nameResult = contract.try_name();
  if (nameResult.reverted) {
    let nameResultBytes = contractNameBytes.try_name();
    if (!nameResultBytes.reverted) {
      if (!isNullBnbValue(nameResultBytes.value.toHex())) {
        nameValue = nameResultBytes.value.toString();
      }
    }
  } else {
    nameValue = nameResult.value;
  }
  return nameValue;
}

export function getOrCreateUser(userAddress: Address): User {
  let user = User.load(userAddress.toHex());
  if (user === null) {
    user = new User(userAddress.toHex());
    user.lpStacked = ZERO_BI;
    user.lpNotStacked = ZERO_BI;
    user.lpTotal = ZERO_BI;
    user.token0Amount = ZERO_BI;
    user.token1Amount = ZERO_BI;
    user.stackTime = ZERO_BI;
    user.save();
  }

  return user as User;
}

export function getUserIfProxy(userAddress: Address): Address {
  let proxy = UserProxy.load(userAddress.toHex());
  if (proxy !== null) {
    return Address.fromString(proxy.user);
  }
  return userAddress;
}

export function getOrCreateTransaction(transactionHash: string, blockNumber: BigInt, timestamp: BigInt): Transaction {
  let transaction = Transaction.load(transactionHash);
  if (transaction === null) {
    transaction = new Transaction(transactionHash);
    transaction.block = blockNumber;
    transaction.timestamp = timestamp;
    transaction.mints = [];
    transaction.burns = [];
  }

  return transaction as Transaction;
}
