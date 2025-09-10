import { prisma } from "./db.js";
import { Prisma } from "../generated/prisma";
import { hashPassword, verifyPassword } from "./utils/auth.js";
import { encryptApiKey, decryptApiKey } from "./utils/encryption.js";
export class DatabaseStorage {
    // Users
    async getUser(id) {
        const user = await prisma.user.findUnique({ where: { id: parseInt(id) } });
        return user ?? undefined;
    }
    async getUserByUsername(username) {
        const user = await prisma.user.findUnique({ where: { username } });
        return user ?? undefined;
    }
    async createUser(insertUser) {
        // 비밀번호 해시화
        if (!insertUser.password) {
            throw new Error("비밀번호가 필요합니다.");
        }
        const hashedPassword = await hashPassword(insertUser.password);
        const user = await prisma.user.create({
            data: {
                username: insertUser.username,
                password: hashedPassword,
                role: insertUser.role ?? "user",
                email: insertUser.email ?? null,
                firstName: insertUser.firstName ?? null,
                lastName: insertUser.lastName ?? null,
                profileImageUrl: insertUser.profileImageUrl ?? null,
            },
        });
        return user;
    }
    async authenticateUser(username, password) {
        const user = await this.getUserByUsername(username);
        if (!user)
            return null;
        const isValidPassword = await verifyPassword(password, user.password);
        if (!isValidPassword)
            return null;
        return user;
    }
    // Exchanges
    async getExchangesByUserId(userId) {
        return prisma.exchange.findMany({ where: { userId: parseInt(userId) } });
    }
    async createExchange(insertExchange) {
        try {
            console.log(`🔍 [${new Date().toISOString()}] DB 저장 시작 - 사용자: ${insertExchange.userId}, 거래소: ${insertExchange.exchange}`);
            console.log(`🔑 [${new Date().toISOString()}] 입력 데이터:`, {
                userId: insertExchange.userId,
                exchange: insertExchange.exchange,
                apiKeyLength: insertExchange.apiKey?.length || 0,
                apiSecretLength: insertExchange.apiSecret?.length || 0,
            });
            // API 키와 시크릿 키 암호화
            const encryptedApiKey = encryptApiKey(insertExchange.apiKey);
            const encryptedSecretKey = encryptApiKey(insertExchange.apiSecret);
            console.log(`🔐 [${new Date().toISOString()}] 암호화 완료:`, {
                encryptedApiKeyLength: encryptedApiKey.length,
                encryptedSecretKeyLength: encryptedSecretKey.length,
            });
            // 기존 거래소 설정이 있는지 확인
            console.log(`🔍 [${new Date().toISOString()}] 기존 거래소 확인 중...`);
            const existingExchange = await prisma.exchange.findFirst({
                where: {
                    userId: insertExchange.userId,
                    exchange: insertExchange.exchange,
                },
            });
            console.log(`🔍 [${new Date().toISOString()}] 기존 거래소 조회 결과:`, {
                found: !!existingExchange,
                existingId: existingExchange?.id,
                existingUserId: existingExchange?.userId,
                existingExchange: existingExchange?.exchange,
            });
            if (existingExchange) {
                // 기존 데이터가 있으면 업데이트
                console.log(`🔄 [${new Date().toISOString()}] 기존 거래소 업데이트 중... ID: ${existingExchange.id}`);
                const updatedExchange = await prisma.exchange.update({
                    where: { id: existingExchange.id },
                    data: {
                        apiKey: encryptedApiKey,
                        apiSecret: encryptedSecretKey,
                        isActive: true,
                    },
                });
                console.log(`✅ [${new Date().toISOString()}] 업데이트 완료:`, {
                    id: updatedExchange.id,
                    userId: updatedExchange.userId,
                    exchange: updatedExchange.exchange,
                    isActive: updatedExchange.isActive,
                    updatedAt: updatedExchange.updatedAt,
                });
                // 업데이트 직후 검증
                const verifyUpdated = await prisma.exchange.findMany({
                    where: {
                        userId: insertExchange.userId,
                        exchange: insertExchange.exchange,
                    },
                });
                console.log(`🔎 [${new Date().toISOString()}] 업데이트 직후 재조회 결과:`, verifyUpdated);
                const totalAfterUpdateRes = await prisma.exchange.count({
                    where: { userId: insertExchange.userId },
                });
                console.log(`📊 [${new Date().toISOString()}] 사용자별 exchanges 총건수(업데이트 후):`, totalAfterUpdateRes);
                return updatedExchange;
            }
            else {
                // 새로운 데이터 삽입
                console.log(`🆕 [${new Date().toISOString()}] 새로운 거래소 삽입 중...`);
                const insertData = {
                    userId: insertExchange.userId,
                    exchange: insertExchange.exchange,
                    apiKey: encryptedApiKey,
                    apiSecret: encryptedSecretKey,
                    isActive: true,
                };
                console.log(`📝 [${new Date().toISOString()}] 삽입할 데이터:`, {
                    userId: insertData.userId,
                    exchange: insertData.exchange,
                    apiKeyLength: insertData.apiKey.length,
                    apiSecretLength: insertData.apiSecret.length,
                    isActive: insertData.isActive,
                });
                const newExchange = await prisma.exchange.create({ data: insertData });
                console.log(`✅ [${new Date().toISOString()}] 삽입 완료:`, {
                    id: newExchange.id,
                    userId: newExchange.userId,
                    exchange: newExchange.exchange,
                    isActive: newExchange.isActive,
                    createdAt: newExchange.createdAt,
                });
                // 삽입 직후 검증
                const verifyInserted = await prisma.exchange.findMany({
                    where: {
                        userId: insertExchange.userId,
                        exchange: insertExchange.exchange,
                    },
                });
                console.log(`🔎 [${new Date().toISOString()}] 삽입 직후 재조회 결과:`, verifyInserted);
                const totalAfterInsertRes = await prisma.exchange.count({
                    where: { userId: insertExchange.userId },
                });
                console.log(`📊 [${new Date().toISOString()}] 사용자별 exchanges 총건수(삽입 후):`, totalAfterInsertRes);
                return newExchange;
            }
        }
        catch (error) {
            console.error(`💥 [${new Date().toISOString()}] DB 저장 중 에러 발생:`, error);
            console.error(`🔍 [${new Date().toISOString()}] 에러 상세 정보:`, {
                message: error.message,
                stack: error.stack,
                code: error.code,
                detail: error.detail,
                hint: error.hint,
                inputData: {
                    userId: insertExchange.userId,
                    exchange: insertExchange.exchange,
                    apiKeyLength: insertExchange.apiKey?.length || 0,
                    apiSecretLength: insertExchange.apiSecret?.length || 0,
                },
            });
            throw error; // 에러를 다시 던져서 routes.ts에서 처리
        }
    }
    async createOrUpdateExchange(exchange) {
        return this.createExchange(exchange);
    }
    // 암호화된 API 키 복호화 메서드
    async getDecryptedExchange(userId, exchangeName) {
        const exchange = await prisma.exchange.findFirst({
            where: {
                userId: parseInt(userId),
                exchange: exchangeName,
                isActive: true,
            },
        });
        if (!exchange)
            return null;
        try {
            return {
                apiKey: decryptApiKey(exchange.apiKey),
                apiSecret: decryptApiKey(exchange.apiSecret),
            };
        }
        catch (error) {
            console.error("API 키 복호화 실패:", error);
            return null;
        }
    }
    async updateExchange(id, updateData) {
        const exchange = await prisma.exchange.update({
            where: { id },
            data: updateData,
        });
        return exchange ?? undefined;
    }
    // Cryptocurrencies
    async getAllCryptocurrencies() {
        return prisma.cryptocurrency.findMany();
    }
    async createCryptocurrency(insertCrypto) {
        const crypto = await prisma.cryptocurrency.create({ data: insertCrypto });
        return crypto;
    }
    // Kimchi Premiums
    async getLatestKimchiPremiums() {
        return prisma.kimchiPremium.findMany({
            orderBy: { timestamp: "desc" },
            take: 100,
        });
    }
    async getKimchiPremiumBySymbol(symbol) {
        const premium = await prisma.kimchiPremium.findFirst({
            where: { symbol },
            orderBy: { timestamp: "desc" },
        });
        return premium ?? undefined;
    }
    async createKimchiPremium(insertPremium) {
        const premium = await prisma.kimchiPremium.create({
            data: {
                symbol: insertPremium.symbol,
                upbitPrice: new Prisma.Decimal(insertPremium.upbitPrice),
                binancePrice: new Prisma.Decimal(insertPremium.binancePrice),
                premiumRate: new Prisma.Decimal(insertPremium.premiumRate),
                exchangeRate: new Prisma.Decimal(insertPremium.exchangeRate),
                premiumAmount: new Prisma.Decimal(insertPremium.premiumAmount),
                timestamp: insertPremium.timestamp ?? new Date(),
            },
        });
        return premium;
    }
    async getKimchiPremiumHistory(symbol, limit = 100) {
        return prisma.kimchiPremium.findMany({
            where: { symbol },
            orderBy: { timestamp: "desc" },
            take: limit,
        });
    }
    // Trading Settings
    async getTradingSettings(userId) {
        const settings = await prisma.tradingSetting.findUnique({
            where: { userId: parseInt(userId) },
        });
        return settings ?? undefined;
    }
    async saveTradingSettings(insertSettings) {
        const data = {
            userId: insertSettings.userId,
            entryPremiumRate: new Prisma.Decimal((insertSettings.entryPremiumRate ?? "2.5")),
            exitPremiumRate: new Prisma.Decimal((insertSettings.exitPremiumRate ?? "1.0")),
            stopLossRate: new Prisma.Decimal((insertSettings.stopLossRate ?? "-1.5")),
            maxPositions: insertSettings.maxPositions ?? 5,
            isAutoTrading: insertSettings.isAutoTrading ?? false,
            maxInvestmentAmount: new Prisma.Decimal((insertSettings.maxInvestmentAmount ?? "10000000")),
            kimchiEntryRate: new Prisma.Decimal((insertSettings.kimchiEntryRate ?? "1.1")),
            kimchiExitRate: new Prisma.Decimal((insertSettings.kimchiExitRate ?? "1.5")),
            kimchiToleranceRate: new Prisma.Decimal((insertSettings.kimchiToleranceRate ?? "0.1")),
            binanceLeverage: insertSettings.binanceLeverage ?? 3,
            upbitEntryAmount: new Prisma.Decimal((insertSettings.upbitEntryAmount ?? "10000000")),
            dailyLossLimit: new Prisma.Decimal((insertSettings.dailyLossLimit ?? "500000")),
            maxPositionSize: new Prisma.Decimal((insertSettings.maxPositionSize ?? "2000000")),
        };
        const settings = await prisma.tradingSetting.upsert({
            where: { userId: insertSettings.userId },
            create: data,
            update: data,
        });
        return settings;
    }
    async getTradingSettingsByUserId(userId) {
        const settings = await prisma.tradingSetting.findUnique({
            where: { userId: parseInt(userId) },
        });
        return settings ?? undefined;
    }
    async createTradingSettings(insertSettings) {
        const settings = await this.saveTradingSettings(insertSettings);
        return settings;
    }
    async updateTradingSettings(userId, updateData) {
        const settings = await prisma.tradingSetting.update({
            where: { userId: parseInt(userId) },
            data: updateData,
        });
        return settings ?? undefined;
    }
    // Positions
    async getActivePositions(userId) {
        return prisma.position.findMany({
            where: { userId: parseInt(userId), status: "open" },
            orderBy: { entryTime: "desc" },
        });
    }
    async getPositionById(id) {
        const position = await prisma.position.findUnique({ where: { id } });
        return position ?? undefined;
    }
    async createPosition(insertPosition) {
        const position = await prisma.position.create({
            data: {
                userId: insertPosition.userId,
                strategyId: insertPosition.strategyId ?? null,
                symbol: insertPosition.symbol,
                type: insertPosition.type ?? "kimchi_arbitrage",
                entryPrice: new Prisma.Decimal(insertPosition.entryPrice),
                currentPrice: insertPosition.currentPrice != null ? new Prisma.Decimal(insertPosition.currentPrice) : null,
                quantity: new Prisma.Decimal(insertPosition.quantity),
                entryPremiumRate: new Prisma.Decimal(insertPosition.entryPremiumRate),
                currentPremiumRate: insertPosition.currentPremiumRate != null ? new Prisma.Decimal(insertPosition.currentPremiumRate) : null,
                status: insertPosition.status ?? "open",
                entryTime: insertPosition.entryTime ?? new Date(),
                exitTime: insertPosition.exitTime ?? null,
                upbitOrderId: insertPosition.upbitOrderId ?? null,
                binanceOrderId: insertPosition.binanceOrderId ?? null,
                side: insertPosition.side,
                exitPrice: insertPosition.exitPrice != null ? new Prisma.Decimal(insertPosition.exitPrice) : null,
            },
        });
        return position;
    }
    async updatePosition(id, updateData) {
        const position = await prisma.position.update({
            where: { id },
            data: { ...updateData, updatedAt: new Date() },
        });
        return position ?? undefined;
    }
    async closePosition(id) {
        const now = new Date();
        const position = await prisma.position.update({
            where: { id },
            data: { status: "closed", exitTime: now, updatedAt: now },
        });
        return position ?? undefined;
    }
    // Trades
    async getTradesByUserId(userId, limit = 50) {
        return prisma.trade.findMany({
            where: { userId: parseInt(userId) },
            orderBy: { executedAt: "desc" },
            take: limit,
        });
    }
    async getTradesByPositionId(positionId) {
        return prisma.trade.findMany({
            where: { positionId },
            orderBy: { executedAt: "desc" },
        });
    }
    async createTrade(insertTrade) {
        const trade = await prisma.trade.create({
            data: {
                userId: insertTrade.userId,
                positionId: insertTrade.positionId ?? null,
                tradeLogId: insertTrade.tradeLogId ?? null,
                symbol: insertTrade.symbol,
                side: insertTrade.side,
                exchange: insertTrade.exchange,
                quantity: new Prisma.Decimal(insertTrade.quantity),
                price: new Prisma.Decimal(insertTrade.price),
                fee: new Prisma.Decimal((insertTrade.fee ?? "0")),
                orderType: insertTrade.orderType ?? "market",
                exchangeOrderId: insertTrade.exchangeOrderId ?? null,
                exchangeTradeId: insertTrade.exchangeTradeId ?? null,
                executedAt: insertTrade.executedAt ?? new Date(),
            },
        });
        return trade;
    }
    // TradeLogs
    async createTradeLog(tradeLog) {
        const log = await prisma.tradeLog.create({
            data: {
                kimp: tradeLog.kimp,
                action: tradeLog.action,
                amount: tradeLog.amount,
                result: tradeLog.result,
            },
        });
        return log;
    }
    async getTradeLogs(limit = 50) {
        return prisma.tradeLog.findMany({
            orderBy: { timestamp: "desc" },
            take: limit,
        });
    }
    // Trading Strategies
    async getTradingStrategies(userId) {
        return prisma.tradingStrategy.findMany({
            where: { userId: parseInt(userId) },
            orderBy: { createdAt: "desc" },
        });
    }
    async getTradingStrategiesByUserId(userId) {
        return prisma.tradingStrategy.findMany({
            where: { userId: parseInt(userId) },
            orderBy: { createdAt: "desc" },
        });
    }
    async createOrUpdateTradingStrategy(strategy) {
        const userId = typeof strategy.userId === 'string' ? parseInt(strategy.userId) : strategy.userId;
        const strategyName = strategy.name || "김치 프리미엄 전략";
        const existing = await prisma.tradingStrategy.findFirst({
            where: { userId, name: strategyName },
        });
        const defaults = {
            strategyType: strategy.strategyType || "positive_kimchi",
            entryRate: new Prisma.Decimal((strategy.entryRate ?? "0.5")),
            exitRate: new Prisma.Decimal((strategy.exitRate ?? "0.1")),
            toleranceRate: new Prisma.Decimal((strategy.toleranceRate ?? "0.1")),
            leverage: strategy.leverage ?? 3,
            investmentAmount: new Prisma.Decimal(String(strategy.investmentAmount ?? "100000")),
            isActive: strategy.isActive ?? true,
            symbol: strategy.symbol ?? "BTC",
            tolerance: new Prisma.Decimal((strategy.tolerance ?? "0.1")),
            isAutoTrading: strategy.isAutoTrading ?? false,
            totalTrades: strategy.totalTrades ?? 0,
            successfulTrades: strategy.successfulTrades ?? 0,
            totalProfit: new Prisma.Decimal((strategy.totalProfit ?? "0")),
            updatedAt: new Date(),
        };
        if (existing) {
            const updated = await prisma.tradingStrategy.update({
                where: { id: existing.id },
                data: { ...defaults, name: strategyName },
            });
            return updated;
        }
        const created = await prisma.tradingStrategy.create({
            data: {
                userId,
                name: strategyName,
                ...defaults,
                createdAt: new Date(),
            },
        });
        return created;
    }
    async getTradingStrategy(id) {
        const strategy = await prisma.tradingStrategy.findUnique({ where: { id } });
        return strategy ?? undefined;
    }
    async createTradingStrategy(insertStrategy) {
        const strategy = await prisma.tradingStrategy.create({
            data: {
                userId: insertStrategy.userId,
                name: insertStrategy.name ?? "김치 프리미엄 전략",
                entryRate: new Prisma.Decimal((insertStrategy.entryRate ?? "0.5")),
                exitRate: new Prisma.Decimal((insertStrategy.exitRate ?? "0.1")),
                leverage: insertStrategy.leverage ?? 1,
                investmentAmount: new Prisma.Decimal((insertStrategy.investmentAmount ?? "100000")),
                isActive: insertStrategy.isActive ?? true,
                symbol: insertStrategy.symbol ?? "BTC",
                tolerance: new Prisma.Decimal((insertStrategy.tolerance ?? "0.1")),
                isAutoTrading: insertStrategy.isAutoTrading ?? false,
                totalTrades: insertStrategy.totalTrades ?? 0,
                successfulTrades: insertStrategy.successfulTrades ?? 0,
                totalProfit: new Prisma.Decimal((insertStrategy.totalProfit ?? "0")),
                strategyType: insertStrategy.strategyType ?? "positive_kimchi",
                toleranceRate: new Prisma.Decimal((insertStrategy.toleranceRate ?? "0.1")),
            },
        });
        return strategy;
    }
    async updateTradingStrategy(id, updateData) {
        const strategy = await prisma.tradingStrategy.update({
            where: { id },
            data: { ...updateData, updatedAt: new Date() },
        });
        return strategy ?? undefined;
    }
    async deleteTradingStrategy(id) {
        try {
            const deleted = await prisma.tradingStrategy.delete({ where: { id } });
            return deleted;
        }
        catch {
            return undefined;
        }
    }
    // System Alerts
    async getSystemAlerts(limit = 50) {
        return prisma.systemAlert.findMany({
            orderBy: { createdAt: "desc" },
            take: limit,
        });
    }
    async createSystemAlert(insertAlert) {
        const alert = await prisma.systemAlert.create({
            data: {
                type: insertAlert.type,
                title: insertAlert.title,
                message: insertAlert.message,
                isRead: insertAlert.isRead ?? false,
                userId: insertAlert.userId ?? null,
                data: insertAlert.data ?? null,
                priority: insertAlert.priority ?? "normal",
            },
        });
        return alert;
    }
    async markAlertAsRead(id) {
        const alert = await prisma.systemAlert.update({
            where: { id },
            data: { isRead: true },
        });
        return alert ?? undefined;
    }
    // Admin methods
    async updateUser(id, updates) {
        if (updates.password) {
            updates.password = await hashPassword(updates.password);
        }
        const user = await prisma.user.update({
            where: { id: parseInt(id) },
            data: { ...updates, updatedAt: new Date() },
        });
        return user ?? undefined;
    }
    async updateUserRole(id, role) {
        const user = await prisma.user.update({
            where: { id: parseInt(id) },
            data: { role, updatedAt: new Date() },
        });
        return user ?? undefined;
    }
    async getAllUsers() {
        return prisma.user.findMany();
    }
    async deleteUser(id) {
        const userId = parseInt(id);
        // 연관 데이터 정리
        await prisma.exchange.deleteMany({ where: { userId } });
        await prisma.tradingSetting.deleteMany({ where: { userId } });
        await prisma.position.deleteMany({ where: { userId } });
        await prisma.trade.deleteMany({ where: { userId } });
        try {
            await prisma.user.delete({ where: { id: userId } });
            return true;
        }
        catch {
            return false;
        }
    }
    async getAllUsersWithStats() {
        const allUsers = await prisma.user.findMany();
        const usersWithStats = await Promise.all(allUsers.map(async (user) => {
            const tradesCount = await prisma.trade.count({ where: { userId: user.id } });
            const positionsCount = await prisma.position.count({ where: { userId: user.id } });
            const exchangesCount = await prisma.exchange.count({ where: { userId: user.id } });
            const { password, ...userWithoutPassword } = user;
            return {
                ...userWithoutPassword,
                _count: {
                    trades: tradesCount,
                    positions: positionsCount,
                    exchanges: exchangesCount,
                },
            };
        }));
        return usersWithStats;
    }
    async getAdminStats() {
        const [totalUsers, activeUsers, totalTrades, activePositions] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { isActive: true } }),
            prisma.trade.count(),
            prisma.position.count({ where: { status: "open" } }),
        ]);
        return {
            totalUsers,
            activeUsers,
            totalTrades,
            activePositions,
            totalVolume: 0,
        };
    }
    // 포지션 조회
    async getPositions(whereClause) {
        return await prisma.position.findMany({
            where: whereClause,
            orderBy: { entryTime: 'desc' }
        });
    }
}
export const storage = new DatabaseStorage();
