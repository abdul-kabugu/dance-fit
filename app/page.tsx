'use client';

import { Button } from '@/components/ui/button';
import {
  deriveBchAddressFromXpub,
  derivePrivateWalletAddress2,
  generateOrganizerWallet,
} from '@/lib/bch-wallets';

export default function Home() {
  const handleGenerate = async () => {
    const { mnemonic, xprv, xpub } = await generateOrganizerWallet();

    console.log(
      `menmonic is ${mnemonic}  and xprv is ${xprv}  and xpub is ${xpub}`,
    );
  };

  const generateNewWallet = async (xpub: string, index: number) => {
    const { address } = deriveBchAddressFromXpub(xpub, index);
    console.log(`generated wallet address index ${index} address ${address}`);
  };

  const generateNewWalletFromPrvk = async (xpub: string, index: number) => {
    const address = derivePrivateWalletAddress2(xpub, index);
    console.log(`generated wallet address index ${index} address ${address}`);
  };

  const xpub =
    'xpub6BsFMCLqMPvJ5ankRqXB82s8u168sYAARKVYagUaUnEXwt2qYbpATBiLNRvbjLjqn3R3j2PBdXDWiUBVu712XAY9mUMtU4YQUfViXhQdZUx';
  const xprv =
    'xprv9xstwgowX2Mzs6iHKozAktvQLyFeU5SK46ZwnJ4xvShZ55hh14VuuPPrX9fnR9tkRt7duoPZwa1twSmfkDFm9vzw2eDSe3pPs61SZsHexYr';
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <h3 className="text-3xl font-bold">Coooking......</h3>

      <Button onClick={handleGenerate}>Gnerate</Button>
      <Button onClick={() => generateNewWallet(xpub, 1)}>
        Gnerate wallet 1
      </Button>
      <Button onClick={() => generateNewWallet(xpub, 2)}>
        Gnerate wallet 2
      </Button>
      <Button onClick={() => generateNewWallet(xpub, 3)}>
        Gnerate wallet 3
      </Button>
      <Button onClick={() => generateNewWallet(xpub, 4)}>Gnerate 4</Button>
      <Button onClick={() => generateNewWallet(xpub, 5)}>
        Gnerate wallet 5
      </Button>

      <Button onClick={() => generateNewWalletFromPrvk(xprv, 2)}>
        Gnerate from pk
      </Button>
    </div>
  );
}
