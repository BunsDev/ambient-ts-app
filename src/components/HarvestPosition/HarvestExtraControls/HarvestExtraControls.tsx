import styles from './HarvestExtraControls.module.css';
// import Toggle2 from '../../Global/Toggle/Toggle2';
import { MdAccountBalanceWallet } from 'react-icons/md';
import ambientLogo from '../../../assets/images/logos/ambient_logo.svg';
import { Dispatch, SetStateAction } from 'react';

interface HarvestExtraControlsPropsIF {
    isSaveAsDexSurplusChecked: boolean;
    setIsSaveAsDexSurplusChecked: Dispatch<SetStateAction<boolean>>;
    baseTokenSymbol: string;
    quoteTokenSymbol: string;
    baseRemovalNum: number;
    quoteRemovalNum: number;
    baseTokenBalance: string;
    quoteTokenBalance: string;
    baseTokenDexBalance: string;
    quoteTokenDexBalance: string;
}

export default function HarvestExtraControls(props: HarvestExtraControlsPropsIF) {
    const {
        isSaveAsDexSurplusChecked,
        setIsSaveAsDexSurplusChecked,
        baseTokenSymbol,
        quoteTokenSymbol,
        baseTokenBalance,
        quoteTokenBalance,
        baseTokenDexBalance,
        quoteTokenDexBalance,
        baseRemovalNum,
        quoteRemovalNum,
    } = props;

    const baseTokenWalletBalanceNum = parseFloat(baseTokenBalance);
    const quoteTokenWalletBalanceNum = parseFloat(quoteTokenBalance);

    const baseTokenDexBalanceNum = parseFloat(baseTokenDexBalance);
    const quoteTokenDexBalanceNum = parseFloat(quoteTokenDexBalance);

    const combinedBaseWalletBalanceAndRemovalNum = baseTokenWalletBalanceNum + baseRemovalNum;
    const combinedQuoteWalletBalanceAndRemovalNum = quoteTokenWalletBalanceNum + quoteRemovalNum;

    const combinedBaseDexBalanceAndRemovalNum = baseTokenDexBalanceNum + baseRemovalNum;
    const combinedQuoteDexBalanceAndRemovalNum = quoteTokenDexBalanceNum + quoteRemovalNum;

    const truncatedWalletBaseQty = isNaN(baseTokenWalletBalanceNum)
        ? '...'
        : baseTokenWalletBalanceNum.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
          });

    const truncatedWalletQuoteQty = isNaN(quoteTokenWalletBalanceNum)
        ? '...'
        : quoteTokenWalletBalanceNum.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
          });

    const truncatedDexBaseQty = isNaN(baseTokenDexBalanceNum)
        ? '...'
        : baseTokenDexBalanceNum.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
          });

    const truncatedDexQuoteQty = isNaN(quoteTokenDexBalanceNum)
        ? '...'
        : quoteTokenDexBalanceNum.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
          });
    const truncatedCombinedWalletBaseQty = isNaN(combinedBaseWalletBalanceAndRemovalNum)
        ? '...'
        : combinedBaseWalletBalanceAndRemovalNum.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
          });

    const truncatedCombinedWalletQuoteQty = isNaN(combinedQuoteWalletBalanceAndRemovalNum)
        ? '...'
        : combinedQuoteWalletBalanceAndRemovalNum.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
          });

    const truncatedCombinedDexBaseQty = isNaN(combinedBaseDexBalanceAndRemovalNum)
        ? '...'
        : combinedBaseDexBalanceAndRemovalNum.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
          });

    const truncatedCombinedDexQuoteQty = isNaN(combinedQuoteDexBalanceAndRemovalNum)
        ? '...'
        : combinedQuoteDexBalanceAndRemovalNum.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
          });

    const exchangeBalanceControl = (
        <section className={styles.wallet_container}>
            <div className={styles.wallet_container_left}>
                <div
                    className={styles.wallet_section}
                    style={{
                        color: !isSaveAsDexSurplusChecked ? '#ebebff' : '#555555',
                        cursor: 'pointer',
                    }}
                    onClick={() => setIsSaveAsDexSurplusChecked(false)}
                >
                    <MdAccountBalanceWallet
                        size={25}
                        color={isSaveAsDexSurplusChecked ? '#555555' : '#EBEBFF'}
                    />
                    <div className={styles.wallet_amounts}>
                        <div>
                            {isSaveAsDexSurplusChecked
                                ? `${truncatedWalletBaseQty} ${baseTokenSymbol}`
                                : `${truncatedCombinedWalletBaseQty} ${baseTokenSymbol}`}
                        </div>
                        <div>
                            {isSaveAsDexSurplusChecked
                                ? `${truncatedWalletQuoteQty} ${quoteTokenSymbol}`
                                : `${truncatedCombinedWalletQuoteQty} ${quoteTokenSymbol}`}
                        </div>
                    </div>
                </div>
                <div
                    className={`${styles.exchange_text} ${
                        !isSaveAsDexSurplusChecked && styles.grey_logo
                    }`}
                    style={{
                        color: isSaveAsDexSurplusChecked ? '#ebebff' : '#555555',
                        cursor: 'pointer',
                    }}
                    onClick={() => setIsSaveAsDexSurplusChecked(true)}
                >
                    <div className={styles.wallet_amounts}>
                        <div>
                            {isSaveAsDexSurplusChecked
                                ? `${truncatedCombinedDexBaseQty} ${baseTokenSymbol}`
                                : `${truncatedDexBaseQty} ${baseTokenSymbol}`}
                        </div>
                        <div>
                            {isSaveAsDexSurplusChecked
                                ? `${truncatedCombinedDexQuoteQty} ${quoteTokenSymbol}`
                                : `${truncatedDexQuoteQty} ${quoteTokenSymbol}`}
                        </div>
                    </div>
                    <img src={ambientLogo} width='25' alt='' />
                </div>
            </div>
            {/* 
            <Toggle2
                isOn={isSaveAsDexSurplusChecked}
                handleToggle={() => setIsSaveAsDexSurplusChecked(!isSaveAsDexSurplusChecked)}
                id='harvest_position_exchange_balance'
                disabled={false}
            /> */}
        </section>
    );
    // const gaslesssTransactionControl = (
    //     <section className={styles.gasless_container}>
    //         <div className={styles.gasless_text}>Enable Gasless Transaction</div>

    //         <Toggle2
    //             isOn={false}
    //             handleToggle={() => console.log('toggled')}
    //             id='gasless_transaction_toggle'
    //             disabled={true}
    //         />
    //     </section>
    // );

    return (
        <div className={styles.main_container}>
            {exchangeBalanceControl}
            {/* {gaslesssTransactionControl} */}
        </div>
    );
}
