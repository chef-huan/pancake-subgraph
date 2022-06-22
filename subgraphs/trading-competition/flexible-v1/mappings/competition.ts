/* eslint-disable prefer-const */
import { Address, BigInt, ethereum, log } from "@graphprotocol/graph-ts";
import { Pair as PairTemplate } from "../generated/templates";
import {
  NewCompetitionStatus,
  UserRandomTeamAssigned,
  UserRegister,
} from "../generated/FlexibleTradingCompV1/FlexibleTradingCompV1";
import {
  BI_ONE,
  BI_TWO,
  TRACKED_TOKEN_BUSD_PAIRS,
  TRACKED_TOKEN_BNB_PAIRS,
  WBNB_BUSD,
  getBnbPriceInUSD,
  getOrCreateCompetition,
  getOrCreateBundle,
  getOrCreateTeam,
  getOrCreateUser,
  getUser,
  getOrCreateRandomAssignTeam,
} from "./utils";

/**
 * BLOCK
 */

export function handleBlock(event: ethereum.Block): void {
  let bundle = getOrCreateBundle();
  bundle.bnbPrice = getBnbPriceInUSD();
  bundle.block = event.number;
  bundle.save();
}

/**
 * COMPETITION
 */

export function handleUserRegister(event: UserRegister): void {
  let competition = getOrCreateCompetition(event.params.competitionId.toString());
  competition.userCount = competition.userCount.plus(BI_ONE);
  competition.save();

  // Fail safe condition in case the team has already been created.
  let team = getOrCreateTeam(event.params.competitionId.toString(), event.params.teamId.toString());
  team.userCount = team.userCount.plus(BI_ONE);
  team.save();

  // Fail safe condition in case the user has already been created.
  getOrCreateUser(competition.id, event.params.userAddress.toHex(), team.id, event.block.number);
}

export function handleUserRandomTeamAssigned(event: UserRandomTeamAssigned): void {
  let user = getUser(event.params.competitionId.toString(), event.params.userAddress.toHex());
  if (user !== null) {
    let randomTeam = getOrCreateRandomAssignTeam(
      event.params.competitionId.toString(),
      event.params.competitionTeamId.toString()
    );
    user.randomAssignTeam = randomTeam.id;

    user.save();
  }
}

export function handleNewCompetitionStatus(event: NewCompetitionStatus): void {
  let competition = getOrCreateCompetition(event.params.competitionId.toString());
  competition.status = BigInt.fromI32(event.params.status);
  competition.save();

  // Competition has status Open, trigger PairCreated to follow `Swap` events.
  if (BigInt.fromI32(event.params.status).equals(BI_TWO)) {
    PairTemplate.create(WBNB_BUSD);
    log.info("Created pair with address {}.", [WBNB_BUSD.toHex()]);

    TRACKED_TOKEN_BUSD_PAIRS.forEach((address: Address) => {
      PairTemplate.create(address);

      log.info("Created pair with address {}.", [address.toHex()]);
    });
    TRACKED_TOKEN_BNB_PAIRS.forEach((address: Address) => {
      PairTemplate.create(address);

      log.info("Created pair with address {}.", [address.toHex()]);
    });
  }
}
