/* eslint-disable prefer-const */
import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Pair } from "../../generated/templates/Pair/Pair";
import { Bundle, Competition, CompetitionInfo, RandomAssignTeam, Team, User } from "../../generated/schema";

export let BI_ZERO = BigInt.fromI32(0);
export let BI_ONE = BigInt.fromI32(1);
export let BI_TWO = BigInt.fromI32(2);
export let BD_ZERO = BigDecimal.fromString("0");
export let BD_1E18 = BigDecimal.fromString("1e18");
export let COMP_INFO_ID = "1";

export let WBNB_BUSD = Address.fromString("0x58F876857a02D6762E0101bb5C46A8c1ED44Dc16");

export let SPECIAL_TRACKED_TOKEN_BNB_PAIRS: Address[] = getAddresses([
  "0x8fa59693458289914db0097f5f366d771b7a7c3f", //MOBOX/BNB
]);

export let SPECIAL_TRACKED_TOKEN_BUSD_PAIRS: Address[] = getAddresses([
  "0x9a4e0660e658e7b4a284079c6c10a5ba74e13926", //MOBOX/BUSD
]);

export let TRACKED_TOKEN_BNB_PAIRS: Address[] = getAddresses([
  "0x0ed7e52944161450477ee417de9cd3a859b14fd0", // CAKE/BNB
]).concat(SPECIAL_TRACKED_TOKEN_BNB_PAIRS);

export let TRACKED_TOKEN_BUSD_PAIRS: Address[] = getAddresses([
  "0x804678fa97d91b974ec2af3c843270886528a9e6", // CAKE/BUSD
]).concat(SPECIAL_TRACKED_TOKEN_BUSD_PAIRS);

export function getBnbPriceInUSD(): BigDecimal {
  // Bind WBNB/BUSD contract to query the pair.
  let pairContract = Pair.bind(WBNB_BUSD);

  // Fail-safe call to get BNB price as BUSD.
  let reserves = pairContract.try_getReserves();
  if (!reserves.reverted) {
    let reserve0 = reserves.value.value0.toBigDecimal().div(BD_1E18);
    let reserve1 = reserves.value.value1.toBigDecimal().div(BD_1E18);

    if (reserve0.notEqual(BD_ZERO)) {
      return reserve1.div(reserve0);
    }
  }

  return BD_ZERO;
}

export function getOrCreateCompetition(competitionId: string): Competition {
  let competition = Competition.load(competitionId);
  if (competition === null) {
    competition = new Competition(competitionId);
    competition.status = BI_ZERO; // Registration
    competition.userCount = BI_ZERO;
    competition.volumeUSD = BD_ZERO;
    competition.volumeBNB = BD_ZERO;
    competition.txCount = BI_ZERO;
    competition.save();

    let competitionInfo = CompetitionInfo.load(COMP_INFO_ID);
    if (competitionInfo === null) {
      competitionInfo = new CompetitionInfo(COMP_INFO_ID);
    }
    competitionInfo.lastCompetition = competition.id;
    competitionInfo.save();
  }

  return competition as Competition;
}

export function getOrCreateTeam(competitionId: string, teamId: string): Team {
  let team = Team.load(competitionId + "-" + teamId); // Use `String` instead of `hex` to make the reconciliation simpler.
  if (team === null) {
    team = new Team(competitionId + "-" + teamId);
    team.volumeUSD = BD_ZERO;
    team.volumeBNB = BD_ZERO;
    team.txCount = BI_ZERO;
    team.save();
  }
  return team as Team;
}

export function getOrCreateRandomAssignTeam(competitionId: string, teamId: string): RandomAssignTeam {
  let team = RandomAssignTeam.load(competitionId + "-" + teamId); // Use `String` instead of `hex` to make the reconciliation simpler.
  if (team === null) {
    team = new RandomAssignTeam(competitionId + "-" + teamId);
    team.volumeUSD = BD_ZERO;
    team.volumeBNB = BD_ZERO;
    team.txCount = BI_ZERO;
    team.save();
  }
  return team as RandomAssignTeam;
}

export function getUser(competitionId: string, userAddressHex: string): User | null {
  return User.load(competitionId + "-" + userAddressHex);
}

export function getOrCreateUser(
  competitionId: string,
  userAddressHex: string,
  teamId: string,
  blockNumber: BigInt
): User {
  let user = getUser(competitionId, userAddressHex);
  if (user === null) {
    user = new User(competitionId + "-" + userAddressHex);
    user.competition = competitionId;
    user.team = teamId;
    user.block = blockNumber;
    user.volumeUSD = BD_ZERO;
    user.volumeBNB = BD_ZERO;
    user.moboxVolumeUSD = BD_ZERO;
    user.moboxVolumeBNB = BD_ZERO;
    user.txCount = BI_ZERO;
    user.save();
  }
  return user as User;
}

export function getOrCreateBundle(): Bundle {
  let bundle = Bundle.load("1");
  if (bundle === null) {
    bundle = new Bundle("1");
    bundle.bnbPrice = BD_ZERO;
    bundle.block = BI_ZERO;
    bundle.save();
  }

  return bundle as Bundle;
}

export function getAddresses(addresses: string[]): Address[] {
  let addressesArray = new Array<Address>(addresses.length);
  for (let i = 0; i < addresses.length; i++) {
    addressesArray[i] = Address.fromString(addresses[i]);
  }
  return addressesArray;
}
