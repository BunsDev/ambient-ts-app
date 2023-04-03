import styles from './NotificationTable.module.css';
import { Dispatch, RefObject, SetStateAction, useEffect } from 'react';
import ReceiptDisplay from '../ReceiptDisplay/ReceiptDisplay';
import FocusTrap from 'focus-trap-react';

import {
    useAppDispatch,
    useAppSelector,
} from '../../../../utils/hooks/reduxToolkit';
import { resetReceiptData } from '../../../../utils/state/receiptDataSlice';

interface NotificationTableProps {
    showNotificationTable: boolean;
    setShowNotificationTable: Dispatch<SetStateAction<boolean>>;
    pendingTransactions: string[];
    lastBlockNumber: number;
    notificationItemRef: RefObject<HTMLDivElement>;
    chainId: string;
}

const NotificationTable = (props: NotificationTableProps) => {
    const {
        showNotificationTable,
        pendingTransactions,
        lastBlockNumber,
        notificationItemRef,
        chainId,
    } = props;

    const dispatch = useAppDispatch();

    const receiptData = useAppSelector((state) => state.receiptData);

    const transactionsByType = receiptData.transactionsByType;

    const parsedReceipts = receiptData.sessionReceipts.map((receipt) =>
        JSON.parse(receipt),
    );

    useEffect(() => {
        if (parsedReceipts.length) console.log({ parsedReceipts });
    }, [JSON.stringify(parsedReceipts)]);

    const successfulTransactions = parsedReceipts.filter(
        (receipt) => receipt?.status === 1,
    );

    const failedTransactions = parsedReceipts.filter(
        (receipt) => receipt?.status === 0,
    );

    const successfulTransactionsDisplay = successfulTransactions.map(
        (tx, idx) => (
            <ReceiptDisplay
                key={idx}
                status='successful'
                hash={tx?.transactionHash}
                chainId={chainId}
                txBlockNumber={tx.blockNumber}
                lastBlockNumber={lastBlockNumber}
                txType={
                    transactionsByType.find(
                        (e) => e.txHash === tx?.transactionHash,
                    )?.txType
                }
            />
        ),
    );
    const failedTransactionsDisplay = failedTransactions.map((tx, idx) => (
        <ReceiptDisplay
            key={idx}
            status='failed'
            hash={tx?.transactionHash}
            chainId={chainId}
            txBlockNumber={tx.blockNumber}
            lastBlockNumber={lastBlockNumber}
            txType={
                transactionsByType.find((e) => e.txHash === tx?.transactionHash)
                    ?.txType
            }
        />
    ));
    const pendingTransactionsDisplay = pendingTransactions.map((tx, idx) => (
        <ReceiptDisplay
            key={idx}
            status='pending'
            hash={tx}
            chainId={chainId}
            lastBlockNumber={lastBlockNumber}
            txType={transactionsByType.find((e) => e.txHash === tx)?.txType}
        />
    ));

    if (!showNotificationTable) return null;
    return (
        <FocusTrap focusTrapOptions={{ clickOutsideDeactivates: true }}>
            <div className={styles.main_container}>
                <div ref={notificationItemRef} className={styles.container}>
                    <section className={styles.header}>
                        Recent Transactions
                    </section>

                    <section className={styles.content}>
                        {pendingTransactionsDisplay}
                        {failedTransactionsDisplay}
                        {successfulTransactionsDisplay}
                    </section>

                    <section className={styles.footer}>
                        <button
                            onClick={() => {
                                dispatch(resetReceiptData());
                            }}
                            aria-label='Clear all'
                        >
                            Clear all
                        </button>
                    </section>
                </div>
            </div>
        </FocusTrap>
    );
};

export default NotificationTable;
