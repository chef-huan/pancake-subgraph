/* eslint-disable prefer-const */
import { UpdateBoostProxy } from "../generated/templates/FarmBoots/FarmBoots";
import { UserProxy } from "../generated/schema";

export function handleUpdateBoostProxy(event: UpdateBoostProxy): void {
  let user = new UserProxy(event.params.proxy.toHex());
  user.user = event.params.user.toHex();
  user.save();
}
