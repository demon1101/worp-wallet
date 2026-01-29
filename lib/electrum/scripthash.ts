import { addressToScriptPubKey } from "@/lib/crypto/address";
import { scriptToScripthash } from "@/lib/crypto/script";

export function addressToScripthash(address: string): string {
  const script = addressToScriptPubKey(address);
  return scriptToScripthash(script);
}
