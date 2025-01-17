import { CrocEnv } from '@crocswap-libs/sdk';
import { BigNumber } from 'ethers';
import {
    ZERO_ADDRESS,
    blastALIEN,
    blastBAG,
    blastBAJA,
    blastBEPE,
    blastMIA,
    blastORBIT,
    blastPACM,
    blastPUMP,
    blastUSDB,
    blastYES,
    blastOLE,
    blastGLORY,
    blastFINGER,
    blastMIM,
} from '../constants';
import { TokenIF } from '../types/token/TokenIF';
import { fetchDepositBalances } from './fetchDepositBalances';
import { memoizePromiseFn } from '../dataLayer/functions/memoizePromiseFn';
import { FetchContractDetailsFn } from './fetchContractDetails';
import { Client } from '@covalenthq/client-sdk';
import { Chains } from '@covalenthq/client-sdk/dist/services/Client';

export interface IDepositedTokenBalance {
    token: string;
    symbol: string;
    decimals: number;
    balance: string;
}

const COVALENT_CHAIN_IDS = {
    '0x1': 'eth-mainnet',
    '0x5': 'eth-goerli',
    '066eed': 'arbitrum-goerli',
    '0x8274f': 'scroll-sepolia-testnet',
    '0x82750': 'scroll-mainnet',
};

export const fetchTokenBalances = async (
    address: string,
    chain: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _refreshTime: number,
    cachedTokenDetails: FetchContractDetailsFn,
    crocEnv: CrocEnv | undefined,
    graphCacheUrl: string,
    client: Client,
): Promise<TokenIF[] | undefined> => {
    if (!crocEnv) return;

    const covalentChainString =
        COVALENT_CHAIN_IDS[chain as keyof typeof COVALENT_CHAIN_IDS] ||
        undefined;

    const combinedBalances: TokenIF[] = [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getTokenInfoFromCovalentBalance = (tokenBalance: any): TokenIF => {
        const tokenBalanceBigNumber = BigNumber.from(
            tokenBalance.balance.toString(),
        );

        return {
            chainId: parseInt(chain),
            logoURI: '',
            name: tokenBalance.contract_name || '',
            address:
                tokenBalance.contract_address ===
                '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
                    ? ZERO_ADDRESS
                    : tokenBalance.contract_address ?? '',
            symbol: tokenBalance.contract_ticker_symbol || '',
            decimals: tokenBalance.contract_decimals || 18,
            walletBalance: tokenBalanceBigNumber.toString(),
        };
    };

    const getTokenInfoFromCacheBalance = (
        tokenBalance: IDepositedTokenBalance,
    ): TokenIF => {
        const dexBalance = tokenBalance.balance;

        return {
            chainId: parseInt(chain),
            logoURI: '',
            name: '',
            address: tokenBalance.token,
            symbol: tokenBalance.symbol,
            decimals: tokenBalance.decimals,
            dexBalance: dexBalance,
        };
    };

    const dexBalancesFromCache = await fetchDepositBalances({
        chainId: chain,
        user: address,
        crocEnv: crocEnv,
        graphCacheUrl: graphCacheUrl,
        cachedTokenDetails: cachedTokenDetails,
    });

    if (covalentChainString !== undefined) {
        const covalentBalancesResponse =
            await client.BalanceService.getTokenBalancesForWalletAddress(
                covalentChainString as Chains,
                address,
                {
                    noSpam: false,
                    quoteCurrency: 'USD',
                    nft: false,
                },
            );

        const covalentData = covalentBalancesResponse.data.items;

        covalentData.map((tokenBalance) => {
            const newToken: TokenIF =
                getTokenInfoFromCovalentBalance(tokenBalance);
            combinedBalances.push(newToken);
        });
    } else {
        const usdbAddress =
            chain === '0xa0c71fd'
                ? '0x4200000000000000000000000000000000000022'
                : '0x4300000000000000000000000000000000000003';

        const ethInWallet = (
            await crocEnv.token(ZERO_ADDRESS).wallet(address)
        ).toString();
        const usdbInWallet = (
            await crocEnv.token(usdbAddress).wallet(address)
        ).toString();
        const orbitInWallet = (
            await crocEnv.token(blastORBIT.address).wallet(address)
        ).toString();
        const bagInWallet = (
            await crocEnv.token(blastBAG.address).wallet(address)
        ).toString();
        const miaInWallet = (
            await crocEnv.token(blastMIA.address).wallet(address)
        ).toString();
        const mimInWallet = (
            await crocEnv.token(blastMIM.address).wallet(address)
        ).toString();
        const alienInWallet = (
            await crocEnv.token(blastALIEN.address).wallet(address)
        ).toString();
        const bajaInWallet = (
            await crocEnv.token(blastBAJA.address).wallet(address)
        ).toString();
        const bepeInWallet = (
            await crocEnv.token(blastBEPE.address).wallet(address)
        ).toString();
        const pacmInWallet = (
            await crocEnv.token(blastPACM.address).wallet(address)
        ).toString();
        const pumpInWallet = (
            await crocEnv.token(blastPUMP.address).wallet(address)
        ).toString();
        const yesInWallet = (
            await crocEnv.token(blastYES.address).wallet(address)
        ).toString();
        const oleInWallet = (
            await crocEnv.token(blastOLE.address).wallet(address)
        ).toString();
        const gloryInWallet = (
            await crocEnv.token(blastGLORY.address).wallet(address)
        ).toString();
        const fingerInWallet = (
            await crocEnv.token(blastFINGER.address).wallet(address)
        ).toString();

        const eth = {
            chainId: 81457,
            logoURI: '',
            name: 'Ether',
            address: '0x0000000000000000000000000000000000000000',
            symbol: 'ETH',
            decimals: 18,
            walletBalance: ethInWallet,
        };
        const usdb = {
            chainId: 81457,
            logoURI: '',
            name: blastUSDB.name,
            address:
                chain === '0xa0c71fd'
                    ? '0x4200000000000000000000000000000000000022'
                    : '0x4300000000000000000000000000000000000003',
            symbol: blastUSDB.symbol,
            decimals: 18,
            walletBalance: usdbInWallet,
        };
        const orbit = {
            chainId: 81457,
            logoURI: '',
            name: blastORBIT.name,
            address: blastORBIT.address,
            symbol: blastORBIT.symbol,
            decimals: 18,
            walletBalance: orbitInWallet,
        };
        const bag = {
            chainId: 81457,
            logoURI: '',
            name: blastBAG.name,
            address: blastBAG.address,
            symbol: blastBAG.symbol,
            decimals: 18,
            walletBalance: bagInWallet,
        };
        const mia = {
            chainId: 81457,
            logoURI: '',
            name: blastMIA.name,
            address: blastMIA.address,
            symbol: blastMIA.symbol,
            decimals: 18,
            walletBalance: miaInWallet,
        };
        const mim = {
            chainId: 81457,
            logoURI: '',
            name: blastMIM.name,
            address: blastMIM.address,
            symbol: blastMIM.symbol,
            decimals: 18,
            walletBalance: mimInWallet,
        };
        const alien = {
            chainId: 81457,
            logoURI: '',
            name: blastALIEN.name,
            address: blastALIEN.address,
            symbol: blastALIEN.symbol,
            decimals: 18,
            walletBalance: alienInWallet,
        };
        const baja = {
            chainId: 81457,
            logoURI: '',
            name: blastBAJA.name,
            address: blastBAJA.address,
            symbol: blastBAJA.symbol,
            decimals: 18,
            walletBalance: bajaInWallet,
        };
        const bepe = {
            chainId: 81457,
            logoURI: '',
            name: blastBEPE.name,
            address: blastBEPE.address,
            symbol: blastBEPE.symbol,
            decimals: 18,
            walletBalance: bepeInWallet,
        };
        const pacm = {
            chainId: 81457,
            logoURI: '',
            name: blastPACM.name,
            address: blastPACM.address,
            symbol: blastPACM.symbol,
            decimals: 18,
            walletBalance: pacmInWallet,
        };
        const pump = {
            chainId: 81457,
            logoURI: '',
            name: blastPUMP.name,
            address: blastPUMP.address,
            symbol: blastPUMP.symbol,
            decimals: 18,
            walletBalance: pumpInWallet,
        };
        const yes = {
            chainId: 81457,
            logoURI: '',
            name: blastYES.name,
            address: blastYES.address,
            symbol: blastYES.symbol,
            decimals: 18,
            walletBalance: yesInWallet,
        };
        const ole = {
            chainId: 81457,
            logoURI: '',
            name: blastOLE.name,
            address: blastOLE.address,
            symbol: blastOLE.symbol,
            decimals: 18,
            walletBalance: oleInWallet,
        };
        const glory = {
            chainId: 81457,
            logoURI: '',
            name: blastGLORY.name,
            address: blastGLORY.address,
            symbol: blastGLORY.symbol,
            decimals: 18,
            walletBalance: gloryInWallet,
        };
        const finger = {
            chainId: 81457,
            logoURI: '',
            name: blastFINGER.name,
            address: blastFINGER.address,
            symbol: blastFINGER.symbol,
            decimals: 18,
            walletBalance: fingerInWallet,
        };
        combinedBalances.push(eth);
        combinedBalances.push(usdb);
        combinedBalances.push(orbit);
        combinedBalances.push(bag);
        combinedBalances.push(mia);
        combinedBalances.push(mim);
        combinedBalances.push(alien);
        combinedBalances.push(baja);
        combinedBalances.push(bepe);
        combinedBalances.push(pacm);
        combinedBalances.push(pump);
        combinedBalances.push(yes);
        combinedBalances.push(ole);
        combinedBalances.push(glory);
        combinedBalances.push(finger);
    }

    if (dexBalancesFromCache !== undefined) {
        dexBalancesFromCache.map((balanceFromCache: IDepositedTokenBalance) => {
            const indexOfExistingToken = (combinedBalances ?? []).findIndex(
                (existingToken) =>
                    existingToken.address === balanceFromCache.token,
            );

            const newToken = getTokenInfoFromCacheBalance(balanceFromCache);

            if (indexOfExistingToken === -1) {
                combinedBalances.push(newToken);
            } else {
                const existingToken = combinedBalances[indexOfExistingToken];

                const updatedToken = { ...existingToken };

                updatedToken.dexBalance = newToken.dexBalance;

                combinedBalances[indexOfExistingToken] = updatedToken;
            }
        });
    }

    return combinedBalances;
};

export type TokenBalancesQueryFn = (
    address: string,
    chain: string,
    refreshTime: number,
    cachedTokenDetails: FetchContractDetailsFn,
    crocEnv: CrocEnv | undefined,
    graphCacheUrl: string,
    client: Client,
) => Promise<TokenIF[]>;

export function memoizeFetchTokenBalances(): TokenBalancesQueryFn {
    return memoizePromiseFn(fetchTokenBalances) as TokenBalancesQueryFn;
}
