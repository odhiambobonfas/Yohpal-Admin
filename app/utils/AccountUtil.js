import Util from '@utils/Util';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '@config/config';
import User from '@models/User';  
import { FirestoreDatabase } from '@utils/FirebaseUtil';
import Department from '@models/Department';
import PaymentAccount from '@models/PaymentAccount';
import AccountTransaction from '@models/AccountTransaction';
import PaymentAccountCategory from '@models/PaymentAccountCategory';
import EmployeeDesignation from '@models/EmployeeDesignation';
import Role from '@models/Role';
import Permissions from '@models/Permissions';
import Holiday from '@models/Holiday';
import Leave from '@models/Leave';
import Attendance from '@models/Attendance';
import Transaction from '@models/Transaction';
import Exception from '@config/exceptions';
import { payloadExtras, ucwords, fbCollectionParser, normalizeFilters } from '@config/utils';
import LANG_EN from '@lang/en';
import admin from 'firebase-admin';

class AccountsUtil extends Util {
    constructor() {
        super();
    }

    async createAccountCategoryQuery(data) { 
        const db = FirestoreDatabase.collection(PaymentAccountCategory.collection)

        const nameSnap = await db.where("name", "==", data.accountCategoryName).get(); 
        if (!nameSnap.empty) {
            throw new Exception(
                201,
                "ACCOUNT_CATEGORY_NAME_DUPLICATE",
                LANG_EN.error.account_category_name_exists,
                "Duplicate Error"
            );
        }

        const codeSnap = await db.where("code", "==", data.accountCategoryCode).get();
        if (!codeSnap.empty) {
            throw new Exception(
                201,
                "ACCOUNT_CATEGORY_CODE_DUPLICATE",
                LANG_EN.error.account_category_code_exists,
                "Duplicate Error"
            );
        }

        let _payloadExtras = {
            userLoggedInUid: data?.userLoggedInUid,
            userLoggedInUserName: data?.userLoggedInUserName
        };

        const extras = payloadExtras(_payloadExtras);
        
        const payload = { 
            name: data.accountCategoryName.trim(),
            code: data.accountCategoryCode ? data.accountCategoryCode.trim() : null,
            description: data.accountCategoryDescription ? data.accountCategoryDescription.trim() : null,
            status: data.status || "active",
            ...extras
        };
        
        const docId = data.accountCategoryCode.trim();
        await db.doc(docId).set(payload);

        return { id: docId, ...payload }; 
    }

    async getAllAccountCategories(redis, filters={}){
        const filtersKey = 'yp:paymentAccountCategories:filters';
        const cacheKey = 'yp:paymentAccountCategories:filtered';
        let ref = FirestoreDatabase.collection(PaymentAccountCategory.collection);

        const cachedFilters = await redis.getFunc(filtersKey);
        const currentFilters = JSON.stringify(normalizeFilters(filters) || {});
        const savedFilters = cachedFilters ? JSON.stringify(normalizeFilters(cachedFilters)) : null;  
        
        await redis.deleteFunc(cacheKey);
        if (savedFilters !== currentFilters) {
            await redis.deleteFunc(filtersKey);
            await redis.deleteFunc(cacheKey);
            await redis.cacheParser(filtersKey, async () => filters, 2000);
        }

        let data = await redis.cacheParser(
            cacheKey,
            async () => { 
                let collection = await ref.get();
                
                let data = fbCollectionParser(collection);

                return data;
            },
            300
        );
        
        return data;
    }

    async createAccountQuery(data, redis) {
        let accountQuery = await FirestoreDatabase.runTransaction(async (trans) => {
            let accountCol = FirestoreDatabase.collection(PaymentAccount.collection);
            let accountRef = accountCol.doc();
            
            const nameSnap = await accountCol
                .where("name", "==", data.accountName)
                .where("category", "==", data.accountCategory)
                .get();

            if (!nameSnap.empty) {
                throw new Exception(
                    201,
                    "ACCOUNT_NAME_DUPLICATE",
                    LANG_EN.error.account_name_exists,
                    "Duplicate account name under this category"
                );
            }

            if (data.accountNumber) {
                const numSnap = await accountCol
                    .where("number", "==", data.accountNumber)
                    .get();
                if (!numSnap.empty) {
                    throw new Exception(
                        201,
                        "ACCOUNT_NUMBER_DUPLICATE",
                        LANG_EN.error.account_number_exists,
                        "Duplicate account number"
                    );
                }
            }
            
            const extras = payloadExtras({
                userLoggedInUid: data?.userLoggedInUid,
                userLoggedInUserName: data?.userLoggedInUserName
            });
        
            
            const openingBalance = parseFloat(data?.openingBalance) || 0;

            // Create the account first 
            const accountData = {
                accountName: data.accountName.trim(),
                accountNumber: data.accountNumber?.trim() || "",
                accountCategory: data.accountCategory.trim(),
                accountCategoryRef: FirestoreDatabase.collection(PaymentAccountCategory.collection).doc(data.accountCategory.trim()),
                ownerName: data.ownerName || "",
                bankDetails: { 
                    bankName: data.bankName || "",
                    swiftCode: data.swiftCode || "", 
                    bankCode: data.bankCode || "",
                    branchCode: data.branchCode || "",
                    bin: data.bin || "",
                },
                ownerContactNumber: data.ownerContactNumber || "",
                accountDescription: data.accountDescription?.trim() || "",
                accountStatus: data.accountStatus || 'inactive',
                applicationName: data?.applicationName || 'yohpal',
                accountBalance: openingBalance || 0,
                ...extras
            };
            
            trans.set(accountRef, accountData);

            // If opening balance exists, record a transaction
            if (openingBalance > 0) { 
                let transRef = FirestoreDatabase.collection(Transaction.collection).doc();
                const transactionPayload = {
                    accountId: accountRef.id,
                    accountRef: FirestoreDatabase.collection(PaymentAccount.collection).doc(accountRef.id),
                    type: "CREDIT",
                    amount: openingBalance,
                    description: "Opening Balance",
                    reference: data.referenceNumber || `OPEN-${accountRef.id.toUpperCase().slice(0, 8)}`,
                    metadata: {
                        tag: "opening_balance"
                    },
                    status: 'success',
                    paymentMethod: data?.paymentMethod || 'other',
                    applicationName: data?.applicationName || 'yohpal',
                    ...extras
                };

                trans.set(transRef, transactionPayload);

                let accountTransRef = FirestoreDatabase.collection(AccountTransaction.collection).doc();
                const accountTransactionPayload = {
                    transactionRef: FirestoreDatabase.collection(Transaction.collection).doc(transRef.id),
                    accountId: accountRef.id,
                    accountRef:  FirestoreDatabase.collection(PaymentAccount.collection).doc(accountRef.id),
                    applicationName: data?.applicationName || 'yohpal',
                    type: "CREDIT",
                    amount: openingBalance,
                    balanceBefore: 0,
                    balanceAfter: openingBalance, 
                    description: "Opening Balance",
                    reference: data.referenceNumber || `OPEN-${accountRef.id.toUpperCase().slice(0, 8)}`, 
                    ...extras
                };

                trans.set(accountTransRef, accountTransactionPayload);
            }

            return { id: accountRef.id, ...accountData, openingBalance };
        });

        if (accountQuery && redis) {
            const cacheKey = 'yp:paymentAccounts:filtered';
            await redis.deleteFunc(cacheKey);
        }

        return accountQuery;
    }

    async getAllAccounts (redis, filters={}){
        const filtersKey = 'yp:paymentAccounts:filters';
        const cacheKey = 'yp:paymentAccounts:filtered';
        let ref = FirestoreDatabase.collection(PaymentAccount.collection);

        const cachedFilters = await redis.getFunc(filtersKey);
        const currentFilters = JSON.stringify(normalizeFilters(filters) || {});
        const savedFilters = cachedFilters ? JSON.stringify(normalizeFilters(cachedFilters)) : null;  
        
        if (savedFilters !== currentFilters) {
            await redis.deleteFunc(filtersKey);
            await redis.deleteFunc(cacheKey);
            await redis.cacheParser(filtersKey, async () => filters, 2000);
        }

        let data = await redis.cacheParser(
            cacheKey,
            async () => { 
                let collection = await ref.get();
                
                let data = fbCollectionParser(collection); 
                
                let fetched = await Promise.all(data.map( async (account) => {
                    let category = {};

                    // if account has a accountCategoryRef reference
                    if (account.accountCategoryRef && account.accountCategoryRef.get) {
                        const userDoc = await account.accountCategoryRef.get(); 
                        if (userDoc.exists) {
                            category = { id: userDoc.id, ...userDoc.data() }; 
                        }
                    }
                    
                    account.category = category; 
                    return account;
                })); 

                return fetched; 
            },
            300
        );
        
        return data;
    }
}

export default new AccountsUtil();