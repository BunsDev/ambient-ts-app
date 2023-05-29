/* eslint-disable @typescript-eslint/no-explicit-any */
// START: Import React and Dongles
import {
    Dispatch,
    SetStateAction,
    useEffect,
    useState,
    useContext,
    useCallback,
    memo,
} from 'react';
import {
    useParams,
    Outlet,
    useOutletContext,
    Link,
    NavLink,
    useNavigate,
    useLocation,
} from 'react-router-dom';
import { ethers } from 'ethers';
import { motion } from 'framer-motion';
import { ChainSpec } from '@crocswap-libs/sdk';
import { VscClose } from 'react-icons/vsc';

// START: Import JSX Components
import TradeCharts from './TradeCharts/TradeCharts';
import TradeTabs2 from '../../components/Trade/TradeTabs/TradeTabs2';
// START: Import Local Files
import styles from './Trade.module.css';
import { useAppSelector } from '../../utils/hooks/reduxToolkit';
import { tradeData as TradeDataIF } from '../../utils/state/tradeDataSlice';
import { CandleData } from '../../utils/state/graphDataSlice';
import { TokenPairIF } from '../../utils/interfaces/exports';
import NoTokenIcon from '../../components/Global/NoTokenIcon/NoTokenIcon';
import TradeSettingsColor from './TradeCharts/TradeSettings/TradeSettingsColor/TradeSettingsColor';
import { SpotPriceFn } from '../../App/functions/querySpotPrice';
import useMediaQuery from '../../utils/hooks/useMediaQuery';
import { chartSettingsMethodsIF } from '../../App/hooks/useChartSettings';
import { IS_LOCAL_ENV } from '../../constants';
import { formSlugForPairParams } from '../../App/functions/urlSlugs';
import { PositionUpdateFn } from '../../App/functions/getPositionData';
import { AppStateContext } from '../../contexts/AppStateContext';
import { CandleContext } from '../../contexts/CandleContext';
import { Drawer } from '@mui/material';
import { FaAngleDoubleLeft } from 'react-icons/fa';
// import { useCandleTime } from './useCandleTime';
import { tokenMethodsIF } from '../../App/hooks/useTokens';
import { useUrlParams } from '../../utils/hooks/useUrlParams';

// interface for React functional component props
interface propsIF {
    isUserLoggedIn: boolean | undefined;
    provider: ethers.providers.Provider | undefined;
    baseTokenAddress: string;
    quoteTokenAddress: string;
    baseTokenBalance: string;
    quoteTokenBalance: string;
    baseTokenDexBalance: string;
    quoteTokenDexBalance: string;
    account: string;
    lastBlockNumber: number;
    isTokenABase: boolean;
    poolPriceDisplay?: number;
    tokenPair: TokenPairIF;
    chainId: string;
    chainData: ChainSpec;
    currentTxActiveInTransactions: string;
    setCurrentTxActiveInTransactions: Dispatch<SetStateAction<string>>;
    isShowAllEnabled: boolean;
    setIsShowAllEnabled: Dispatch<SetStateAction<boolean>>;
    expandTradeTable: boolean;
    setExpandTradeTable: Dispatch<SetStateAction<boolean>>;
    limitRate: string;
    currentPositionActive: string;
    setCurrentPositionActive: Dispatch<SetStateAction<string>>;
    isInitialized: boolean;
    poolPriceNonDisplay: number | undefined;
    poolExists: boolean | undefined;
    setTokenPairLocal: Dispatch<SetStateAction<string[] | null>>;
    handlePulseAnimation: (type: string) => void;
    cachedQuerySpotPrice: SpotPriceFn;
    setSimpleRangeWidth: Dispatch<SetStateAction<number>>;
    simpleRangeWidth: number;
    setRepositionRangeWidth: Dispatch<SetStateAction<number>>;
    repositionRangeWidth: number;
    chartSettings: chartSettingsMethodsIF;
    ethMainnetUsdPrice: number | undefined;
    gasPriceInGwei: number | undefined;
    cachedPositionUpdateQuery: PositionUpdateFn;
    poolPriceChangePercent: string | undefined;
    isPoolPriceChangePositive: boolean;
    isTradeDrawerOpen: boolean;
    toggleTradeDrawer: (
        open: boolean,
    ) => (event: React.KeyboardEvent | React.MouseEvent) => void;
    setIsTradeDrawerOpen: Dispatch<SetStateAction<boolean>>;
    tokens: tokenMethodsIF;
}

// React functional component
function Trade(props: propsIF) {
    const {
        isPoolPriceChangePositive,
        poolPriceChangePercent,
        chartSettings,
        cachedQuerySpotPrice,
        cachedPositionUpdateQuery,
        isUserLoggedIn,
        chainId,
        chainData,
        poolPriceDisplay,
        provider,
        lastBlockNumber,
        baseTokenAddress,
        quoteTokenAddress,
        baseTokenBalance,
        quoteTokenBalance,
        baseTokenDexBalance,
        quoteTokenDexBalance,
        expandTradeTable,
        setExpandTradeTable,
        isShowAllEnabled,
        setIsShowAllEnabled,
        isTokenABase,
        poolPriceNonDisplay,
        account,
        currentTxActiveInTransactions,
        setCurrentTxActiveInTransactions,
        poolExists,
        handlePulseAnimation,
        setSimpleRangeWidth,
        simpleRangeWidth,
        setRepositionRangeWidth,
        repositionRangeWidth,
        gasPriceInGwei,
        ethMainnetUsdPrice,
        isTradeDrawerOpen,

        setIsTradeDrawerOpen,
        tokens,
    } = props;

    const { params } = useParams();

    useUrlParams(tokens, chainId, provider);

    const {
        chart: { isFullScreen: isChartFullScreen },
        outsideControl: { setIsActive: setOutsideControlActive },
        outsideTab: { setSelected: setOutsideTabSelected },
    } = useContext(AppStateContext);

    const {
        candleData: { value: candleData },
        isCandleSelected: {
            value: isCandleSelected,
            setValue: setIsCandleSelected,
        },
        isCandleDataNull: { value: isCandleDataNull },
    } = useContext(CandleContext);

    const [transactionFilter, setTransactionFilter] = useState<CandleData>();
    const [isCandleArrived, setIsCandleDataArrived] = useState(false);

    const navigate = useNavigate();

    const routes = [
        {
            path: '/market',
            name: 'Swap',
        },
        {
            path: '/limit',
            name: 'Limit',
        },
        {
            path: '/range',
            name: 'Pool',
        },
    ];

    const { pathname } = useLocation();

    const isMarketOrLimitModule =
        pathname.includes('market') || pathname.includes('limit');

    useEffect(() => {
        if (
            isCandleDataNull &&
            candleData !== undefined &&
            candleData.candles?.length > 0
        ) {
            IS_LOCAL_ENV && console.debug('Data arrived');
            setIsCandleDataArrived(false);
        }
    }, [candleData]);

    const [selectedDate, setSelectedDate] = useState<number | undefined>();

    const { tradeData, graphData } = useAppSelector((state) => state);
    const { isDenomBase, limitTick, advancedMode } = tradeData;
    const baseTokenLogo = isDenomBase
        ? tradeData.baseToken.logoURI
        : tradeData.quoteToken.logoURI;
    const quoteTokenLogo = isDenomBase
        ? tradeData.quoteToken.logoURI
        : tradeData.baseToken.logoURI;

    const baseTokenSymbol = isDenomBase
        ? tradeData.baseToken.symbol
        : tradeData.quoteToken.symbol;
    const quoteTokenSymbol = isDenomBase
        ? tradeData.quoteToken.symbol
        : tradeData.baseToken.symbol;

    const liquidityData = graphData?.liquidityData;

    const poolPriceDisplayWithDenom = poolPriceDisplay
        ? isDenomBase
            ? 1 / poolPriceDisplay
            : poolPriceDisplay
        : 0;

    const navigationMenu = (
        <div className={styles.navigation_menu}>
            {routes.map((route, idx) => (
                <div
                    className={`${styles.nav_container} trade_route`}
                    key={idx}
                >
                    <NavLink to={`/trade${route.path}/${params}`}>
                        {route.name}
                    </NavLink>
                </div>
            ))}
        </div>
    );

    const mainContent = (
        <div
            className={`${styles.right_col} 
            }`}
        >
            <Outlet
                context={{
                    tradeData: tradeData,
                    navigationMenu: navigationMenu,
                }}
            />
        </div>
    );
    const expandGraphStyle = expandTradeTable ? styles.hide_graph : '';
    const fullScreenStyle = isChartFullScreen
        ? styles.chart_full_screen
        : styles.main__chart;

    const [hasInitialized, setHasInitialized] = useState(false);

    const changeState = useCallback(
        (isOpen: boolean | undefined, candleData: CandleData | undefined) => {
            setIsCandleSelected(isOpen);
            setHasInitialized(false);
            setTransactionFilter(candleData);
            if (isOpen) {
                setOutsideControlActive(true);
                setOutsideTabSelected(0);
            }
        },
        [],
    );

    const [chartBg, setChartBg] = useState('transparent');

    const [upBodyColorPicker, setUpBodyColorPicker] = useState<boolean>(false);
    const [upBorderColorPicker, setUpBorderColorPicker] =
        useState<boolean>(false);
    const [downBodyColorPicker, setDownBodyColorPicker] =
        useState<boolean>(false);
    const [downBorderColorPicker, setDownBorderColorPicker] =
        useState<boolean>(false);

    const [upBodyColor, setUpBodyColor] = useState<string>('#CDC1FF');
    const [upBorderColor, setUpBorderColor] = useState<string>('#CDC1FF');
    const [downBodyColor, setDownBodyColor] = useState<string>('#24243e');
    const [downBorderColor, setDownBorderColor] = useState<string>('#7371FC');
    const [upVolumeColor] = useState<string>('rgba(205,193,255, 0.5)');
    const [downVolumeColor] = useState<string>('rgba(115,113,252, 0.5)');

    const handleChartBgColorPickerChange = (color: any) => {
        setChartBg(color.hex);
    };
    const handleBodyColorPickerChange = (color: any) => {
        setUpBodyColor(color.hex);
    };
    const handleBorderColorPickerChange = (color: any) => {
        setUpBorderColor(color.hex);
    };
    const handleDownBodyColorPickerChange = (color: any) => {
        setDownBodyColor(color.hex);
    };
    const handleDownBorderColorPickerChange = (color: any) => {
        setDownBorderColor(color.hex);
    };
    const tradeSettingsColorProps = {
        upBodyColorPicker: upBodyColorPicker,
        setUpBodyColorPicker: setUpBodyColorPicker,
        upBodyColor: upBodyColor,
        handleBodyColorPickerChange: handleBodyColorPickerChange,
        handleBorderColorPickerChange: handleBorderColorPickerChange,
        handleDownBodyColorPickerChange: handleDownBodyColorPickerChange,
        handleDownBorderColorPickerChange: handleDownBorderColorPickerChange,
        setUpBorderColorPicker: setUpBorderColorPicker,
        setDownBodyColorPicker: setDownBodyColorPicker,
        setDownBorderColorPicker: setDownBorderColorPicker,
        upBorderColor: upBorderColor,
        upBorderColorPicker: upBorderColorPicker,
        downBodyColor: downBodyColor,
        downBodyColorPicker: downBodyColorPicker,
        downBorderColor: downBorderColor,
        downBorderColorPicker: downBorderColorPicker,
        chartBg: chartBg,
        setChartBg: setChartBg,
        handleChartBgColorPickerChange: handleChartBgColorPickerChange,
    };

    const unselectCandle = useCallback(() => {
        setSelectedDate(undefined);
        changeState(false, undefined);
        setIsCandleSelected(false);
    }, []);

    const activeCandleDuration = isMarketOrLimitModule
        ? chartSettings.candleTime.market.time
        : chartSettings.candleTime.range.time;

    useEffect(() => {
        unselectCandle();
    }, [
        activeCandleDuration,
        tradeData.baseToken.name,
        tradeData.quoteToken.name,
    ]);

    const initLinkPath =
        '/initpool/' +
        formSlugForPairParams(chainId, baseTokenAddress, quoteTokenAddress);

    const poolNotInitializedContent =
        poolExists === false ? (
            <div className={styles.pool_not_initialialized_container}>
                <div className={styles.pool_not_initialialized_content}>
                    <div
                        className={styles.close_init}
                        onClick={() => navigate(-1)}
                    >
                        <VscClose size={25} />
                    </div>
                    <h2>This pool has not been initialized.</h2>
                    <h3>Do you want to initialize it?</h3>
                    <Link to={initLinkPath} className={styles.initialize_link}>
                        Initialize Pool
                        {baseTokenLogo ? (
                            <img src={baseTokenLogo} alt={baseTokenSymbol} />
                        ) : (
                            <NoTokenIcon
                                tokenInitial={baseTokenSymbol?.charAt(0)}
                                width='20px'
                            />
                        )}
                        {quoteTokenLogo ? (
                            <img src={quoteTokenLogo} alt={quoteTokenSymbol} />
                        ) : (
                            <NoTokenIcon
                                tokenInitial={quoteTokenSymbol?.charAt(0)}
                                width='20px'
                            />
                        )}
                    </Link>
                    <button
                        className={styles.no_thanks}
                        onClick={() => navigate(-1)}
                    >
                        No, take me back.
                    </button>
                </div>
            </div>
        ) : null;

    const tradeChartsProps = {
        isPoolPriceChangePositive: isPoolPriceChangePositive,
        chartSettings: chartSettings,
        isUserLoggedIn: isUserLoggedIn,
        chainData: chainData,
        poolPriceDisplay: poolPriceDisplayWithDenom,
        expandTradeTable: expandTradeTable,
        setExpandTradeTable: setExpandTradeTable,
        isTokenABase: isTokenABase,
        changeState: changeState,
        liquidityData: liquidityData,
        lastBlockNumber: lastBlockNumber,
        chainId: chainId,
        limitTick: limitTick,
        isAdvancedModeActive: advancedMode,
        simpleRangeWidth: simpleRangeWidth,
        upBodyColor: upBodyColor,
        upBorderColor: upBorderColor,
        downBodyColor: downBodyColor,
        downBorderColor: downBorderColor,
        upVolumeColor: upVolumeColor,
        downVolumeColor: downVolumeColor,
        baseTokenAddress: baseTokenAddress,
        quoteTokenAddress: quoteTokenAddress,
        poolPriceNonDisplay: poolPriceNonDisplay,
        selectedDate: selectedDate,
        setSelectedDate: setSelectedDate,
        handlePulseAnimation: handlePulseAnimation,
        poolPriceChangePercent: poolPriceChangePercent,
        TradeSettingsColor: <TradeSettingsColor {...tradeSettingsColorProps} />,
        setSimpleRangeWidth: setSimpleRangeWidth,
        setRepositionRangeWidth: setRepositionRangeWidth,
        repositionRangeWidth: repositionRangeWidth,
    };

    const tradeTabsProps = {
        cachedQuerySpotPrice: cachedQuerySpotPrice,
        cachedPositionUpdateQuery: cachedPositionUpdateQuery,
        isUserLoggedIn: isUserLoggedIn,
        isTokenABase: isTokenABase,
        provider: provider,
        account: account,
        lastBlockNumber: lastBlockNumber,
        chainId: chainId,
        chainData: chainData,
        currentTxActiveInTransactions: currentTxActiveInTransactions,
        setCurrentTxActiveInTransactions: setCurrentTxActiveInTransactions,
        baseTokenBalance: baseTokenBalance,
        quoteTokenBalance: quoteTokenBalance,
        baseTokenDexBalance: baseTokenDexBalance,
        quoteTokenDexBalance: quoteTokenDexBalance,
        isShowAllEnabled: isShowAllEnabled,
        setIsShowAllEnabled: setIsShowAllEnabled,
        expandTradeTable: expandTradeTable,
        setExpandTradeTable: setExpandTradeTable,
        isCandleSelected: isCandleSelected,
        setIsCandleSelected: setIsCandleSelected,
        filter: transactionFilter,
        setTransactionFilter: setTransactionFilter,
        currentPositionActive: props.currentPositionActive,
        setCurrentPositionActive: props.setCurrentPositionActive,
        handlePulseAnimation: handlePulseAnimation,
        changeState: changeState,
        selectedDate: selectedDate,
        setSelectedDate: setSelectedDate,
        hasInitialized: hasInitialized,
        setHasInitialized: setHasInitialized,
        unselectCandle: unselectCandle,
        poolPriceDisplay: poolPriceDisplayWithDenom,
        poolPriceChangePercent: poolPriceChangePercent,
        isPoolPriceChangePositive: isPoolPriceChangePositive,
        isCandleDataNull: isCandleDataNull,
        isCandleArrived: isCandleArrived,
        setIsCandleDataArrived: setIsCandleDataArrived,
        setSimpleRangeWidth: setSimpleRangeWidth,
        gasPriceInGwei: gasPriceInGwei,
        ethMainnetUsdPrice: ethMainnetUsdPrice,
        candleTime: isMarketOrLimitModule
            ? chartSettings.candleTime.market
            : chartSettings.candleTime.range,
        tokens,
        // showActiveMobileComponent: showActiveMobileComponent,
    };

    const bottomTabs = useMediaQuery('(max-width: 1020px)');

    return (
        <section className={styles.main_layout}>
            <div
                className={`${styles.middle_col}
                ${expandTradeTable ? styles.flex_column : ''}`}
            >
                {poolNotInitializedContent}
                <div
                    className={` ${expandGraphStyle} 
                    } ${fullScreenStyle}`}
                    style={{
                        background: chartBg,
                    }}
                >
                    <div className={styles.main__chart_container}>
                        {!isCandleDataNull && (
                            <TradeCharts {...tradeChartsProps} />
                        )}
                    </div>
                </div>

                <motion.div
                    className={
                        expandTradeTable
                            ? styles.full_table_height
                            : styles.min_table_height
                    }
                >
                    <div>
                        <TradeTabs2 {...tradeTabsProps} />
                    </div>
                </motion.div>
            </div>
            {!bottomTabs && mainContent}

            <Drawer
                anchor='right'
                open={isTradeDrawerOpen}
                onClose={() => setIsTradeDrawerOpen(false)}
            >
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    <div
                        style={{
                            width: '100%',
                            background: 'var(--dark2)',
                            zIndex: '3',
                        }}
                        onClick={() => setIsTradeDrawerOpen(false)}
                    >
                        <FaAngleDoubleLeft size={30} color='white' />
                    </div>

                    <Outlet
                        context={{
                            tradeData: tradeData,
                            navigationMenu: navigationMenu,
                        }}
                    />
                </div>
            </Drawer>
        </section>
    );
}

type ContextType = {
    tradeData: TradeDataIF;
    navigationMenu: JSX.Element;
    limitTickFromParams: number | null;
};

export function useTradeData() {
    return useOutletContext<ContextType>();
}

export default memo(Trade);
