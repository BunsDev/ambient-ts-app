import React, {
    createContext,
    useContext,
    useEffect,
    Dispatch,
    SetStateAction,
} from 'react';
import { useDispatch } from 'react-redux';
import { useAccount } from 'wagmi';
import { fetchUserRecentChanges } from '../App/functions/fetchUserRecentChanges';
import { getLimitOrderData } from '../App/functions/getLimitOrderData';
import { getPositionData } from '../App/functions/getPositionData';
import useDebounce from '../App/hooks/useDebounce';
import { GRAPHCACHE_SMALL_URL, IS_LOCAL_ENV } from '../constants';
import { LimitOrderServerIF } from '../utils/interfaces/LimitOrderIF';
import { PositionServerIF } from '../utils/interfaces/PositionIF';
import { TokenIF } from '../utils/interfaces/TokenIF';
import { TransactionIF } from '../utils/interfaces/TransactionIF';
import {
    resetUserGraphData,
    setChangesByUser,
    setDataLoadingStatus,
    setLimitOrdersByUser,
    setPositionsByUser,
} from '../utils/state/graphDataSlice';

import { AppStateContext } from './AppStateContext';
import { CachedDataContext } from './CachedDataContext';
import { ChainDataContext } from './ChainDataContext';
import { CrocEnvContext } from './CrocEnvContext';
import { TokenContext } from './TokenContext';

interface UserDataContextIF {
    isUserConnected: boolean | undefined;
    userAddress: `0x${string}` | undefined;
    resetUserAddress: () => void;
    tokenBalances: TokenIF[] | undefined;
    setTokenBalances: Dispatch<SetStateAction<TokenIF[] | undefined>>;
    setTokenBalance: (params: {
        tokenAddress: string;
        walletBalance?: string | undefined;
        dexBalance?: string | undefined;
    }) => void;
    resolvedAddressFromContext: string;
    setResolvedAddressInContext: Dispatch<SetStateAction<string>>;
}
export const UserDataContext = createContext<UserDataContextIF>(
    {} as UserDataContextIF,
);

export const UserDataContextProvider = (props: {
    children: React.ReactNode;
}) => {
    const [isUserConnected, setIsUserConnected] =
        React.useState<boolean>(false);
    const [userAddress, setUserAddress] = React.useState<
        `0x${string}` | undefined
    >(undefined);

    const [tokenBalances, setTokenBalances] = React.useState<
        TokenIF[] | undefined
    >(undefined);

    const [resolvedAddressFromContext, setResolvedAddressInContext] =
        React.useState<string>('');

    const dispatch = useDispatch();
    const {
        server: { isEnabled: isServerEnabled },
    } = useContext(AppStateContext);
    const {
        cachedQuerySpotPrice,
        cachedFetchTokenPrice,
        cachedTokenDetails,
        cachedEnsResolve,
    } = useContext(CachedDataContext);
    const { crocEnv, activeNetwork, provider, chainData } =
        useContext(CrocEnvContext);
    const { lastBlockNumber } = useContext(ChainDataContext);
    const { tokens } = useContext(TokenContext);

    const { address: wagmiAddress, isConnected } = useAccount();

    const resetUserAddress = () => {
        setUserAddress(undefined);
    };
    const setTokenBalance = (params: {
        tokenAddress: string;
        walletBalance?: string | undefined;
        dexBalance?: string | undefined;
    }) => {
        if (!tokenBalances) return;
        const newTokenBalances = [...tokenBalances];

        const tokenIndex = newTokenBalances?.findIndex(
            (token) =>
                token.address.toLowerCase() ===
                params.tokenAddress.toLowerCase(),
        );

        if (newTokenBalances && tokenIndex && tokenIndex !== -1) {
            const newTokenBalance = newTokenBalances[tokenIndex];
            if (params.walletBalance) {
                newTokenBalance.walletBalance = params.walletBalance;
            }
            if (params.dexBalance) {
                newTokenBalance.dexBalance = params.dexBalance;
            }
            if (params.dexBalance || params.walletBalance) {
                newTokenBalances[tokenIndex] = newTokenBalance;
                setTokenBalances(newTokenBalances);
            }
        }
    };

    // TODO: Wagmi isConnected === userData.isLoggedIn - can consolidate and use either as source of truth && Wagmi address === useData.userAddress
    useEffect(() => {
        setIsUserConnected(isConnected);
        setUserAddress(wagmiAddress);
        setTokenBalances(undefined);
        dispatch(resetUserGraphData());
    }, [isConnected, isUserConnected, wagmiAddress]);

    const userLimitOrderStatesCacheEndpoint = GRAPHCACHE_SMALL_URL
        ? GRAPHCACHE_SMALL_URL + '/user_limit_orders?'
        : activeNetwork.graphCacheUrl + '/user_limit_orders?';

    // Wait 2 seconds before refreshing to give cache server time to sync from
    // last block
    const lastBlockNumWait = useDebounce(lastBlockNumber, 2000);

    useEffect(() => {
        // This useEffect controls a series of other dispatches that fetch data on update of the user object
        // user Postions, limit orders, and recent changes are all governed here
        if (
            isServerEnabled &&
            isConnected &&
            userAddress &&
            crocEnv &&
            provider &&
            tokens.tokenUniv.length &&
            chainData.chainId
        ) {
            IS_LOCAL_ENV && console.debug('fetching user positions');

            const userPositionsCacheEndpoint = GRAPHCACHE_SMALL_URL
                ? GRAPHCACHE_SMALL_URL + '/user_positions?'
                : activeNetwork.graphCacheUrl + '/user_positions?';

            try {
                fetch(
                    userPositionsCacheEndpoint +
                        new URLSearchParams({
                            user: userAddress,
                            chainId: chainData.chainId,
                            ensResolution: 'true',
                            annotate: 'true',
                            omitKnockout: 'true',
                            addValue: 'true',
                        }),
                )
                    .then((response) => response?.json())
                    .then((json) => {
                        const userPositions = json?.data;
                        if (userPositions && crocEnv) {
                            Promise.all(
                                userPositions.map(
                                    (position: PositionServerIF) => {
                                        return getPositionData(
                                            position,
                                            tokens.tokenUniv,
                                            crocEnv,
                                            provider,
                                            chainData.chainId,
                                            lastBlockNumber,
                                            cachedFetchTokenPrice,
                                            cachedQuerySpotPrice,
                                            cachedTokenDetails,
                                            cachedEnsResolve,
                                        );
                                    },
                                ),
                            ).then((updatedPositions) => {
                                dispatch(
                                    setPositionsByUser({
                                        dataReceived: true,
                                        positions: updatedPositions,
                                    }),
                                );
                                dispatch(
                                    setDataLoadingStatus({
                                        datasetName: 'connectedUserRangeData',
                                        loadingStatus: false,
                                    }),
                                );
                            });
                        }
                    })
                    .catch(console.error);
            } catch (error) {
                console.error;
            }

            IS_LOCAL_ENV && console.debug('fetching user limit orders ');

            fetch(
                userLimitOrderStatesCacheEndpoint +
                    new URLSearchParams({
                        user: userAddress,
                        chainId: chainData.chainId,
                        ensResolution: 'true',
                        omitEmpty: 'true',
                    }),
            )
                .then((response) => response?.json())
                .then((json) => {
                    const userLimitOrderStates = json?.data;
                    if (userLimitOrderStates) {
                        Promise.all(
                            userLimitOrderStates.map(
                                (limitOrder: LimitOrderServerIF) => {
                                    return getLimitOrderData(
                                        limitOrder,
                                        tokens.tokenUniv,
                                        crocEnv,
                                        provider,
                                        chainData.chainId,
                                        lastBlockNumber,
                                        cachedFetchTokenPrice,
                                        cachedQuerySpotPrice,
                                        cachedTokenDetails,
                                        cachedEnsResolve,
                                    );
                                },
                            ),
                        ).then((updatedLimitOrderStates) => {
                            dispatch(
                                setLimitOrdersByUser({
                                    dataReceived: true,
                                    limitOrders: updatedLimitOrderStates,
                                }),
                            );
                            dispatch(
                                setDataLoadingStatus({
                                    datasetName: 'connectedUserOrderData',
                                    loadingStatus: false,
                                }),
                            );
                        });
                    }
                })
                .catch(console.error);

            try {
                fetchUserRecentChanges({
                    tokenList: tokens.tokenUniv,
                    user: userAddress,
                    chainId: chainData.chainId,
                    annotate: true,
                    addValue: true,
                    simpleCalc: true,
                    annotateMEV: false,
                    ensResolution: true,
                    crocEnv: crocEnv,
                    graphCacheUrl: activeNetwork.graphCacheUrl,
                    provider,
                    lastBlockNumber: lastBlockNumber,
                    n: 100, // fetch last 100 changes,
                    cachedFetchTokenPrice: cachedFetchTokenPrice,
                    cachedQuerySpotPrice: cachedQuerySpotPrice,
                    cachedTokenDetails: cachedTokenDetails,
                    cachedEnsResolve: cachedEnsResolve,
                })
                    .then((updatedTransactions) => {
                        if (updatedTransactions) {
                            dispatch(
                                setChangesByUser({
                                    dataReceived: true,
                                    changes: updatedTransactions,
                                }),
                            );
                            const result: TokenIF[] = [];
                            const tokenMap = new Map();
                            for (const item of updatedTransactions as TransactionIF[]) {
                                if (!tokenMap.has(item.base)) {
                                    const isFoundInAmbientList =
                                        tokens.defaultTokens.some(
                                            (ambientToken) => {
                                                if (
                                                    ambientToken.address.toLowerCase() ===
                                                    item.base.toLowerCase()
                                                )
                                                    return true;
                                                return false;
                                            },
                                        );
                                    if (!isFoundInAmbientList) {
                                        tokenMap.set(item.base, true); // set any value to Map
                                        result.push({
                                            name: item.baseName,
                                            address: item.base,
                                            symbol: item.baseSymbol,
                                            decimals: item.baseDecimals,
                                            chainId: parseInt(item.chainId),
                                            logoURI: item.baseTokenLogoURI,
                                        });
                                    }
                                }
                                if (!tokenMap.has(item.quote)) {
                                    const isFoundInAmbientList =
                                        tokens.defaultTokens.some(
                                            (ambientToken) => {
                                                if (
                                                    ambientToken.address.toLowerCase() ===
                                                    item.quote.toLowerCase()
                                                )
                                                    return true;
                                                return false;
                                            },
                                        );
                                    if (!isFoundInAmbientList) {
                                        tokenMap.set(item.quote, true); // set any value to Map
                                        result.push({
                                            name: item.quoteName,
                                            address: item.quote,
                                            symbol: item.quoteSymbol,
                                            decimals: item.quoteDecimals,
                                            chainId: parseInt(item.chainId),
                                            logoURI: item.quoteTokenLogoURI,
                                        });
                                    }
                                }
                            }
                            // setRecentTokens(result); // TODO: what to do here?  from useRecentTokens?
                        }

                        dispatch(
                            setDataLoadingStatus({
                                datasetName: 'connectedUserTxData',
                                loadingStatus: false,
                            }),
                        );
                    })
                    .catch(console.error);
            } catch (error) {
                console.error;
            }
        }
    }, [
        isServerEnabled,
        tokens.tokenUniv.length,
        isConnected,
        userAddress,
        chainData.chainId,
        lastBlockNumWait,
        !!crocEnv,
        !!provider,
    ]);

    const userDataContext: UserDataContextIF = {
        isUserConnected,
        userAddress,
        resetUserAddress,
        tokenBalances,
        setTokenBalances,
        setTokenBalance,
        resolvedAddressFromContext,
        setResolvedAddressInContext,
    };

    return (
        <UserDataContext.Provider value={userDataContext}>
            {props.children}
        </UserDataContext.Provider>
    );
};
