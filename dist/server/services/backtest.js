var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { SimpleKimchiService } from "./simple-kimchi.js";
var BacktestService = /** @class */ (function () {
    function BacktestService() {
        this.simpleKimchiService = new SimpleKimchiService();
        // In a real scenario, you'd fetch historical data here or have a way to access it.
    }
    BacktestService.prototype.runBacktest = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var mockTrades, totalProfit, winningTrades, result;
            return __generator(this, function (_a) {
                console.log("Running backtest with params:", params);
                mockTrades = [
                    {
                        entryTime: "2023-10-01T10:00:00Z",
                        entryPrice: 50000000,
                        entryKimchiPremium: params.entryRate,
                        exitTime: "2023-10-01T12:30:00Z",
                        exitPrice: 50100000,
                        exitKimchiPremium: params.exitRate,
                        profit: 100000,
                    },
                    {
                        entryTime: "2023-10-02T15:00:00Z",
                        entryPrice: 50200000,
                        entryKimchiPremium: params.entryRate,
                        exitTime: "2023-10-02T16:00:00Z",
                        exitPrice: 50150000,
                        exitKimchiPremium: params.exitRate,
                        profit: -50000,
                    },
                    {
                        entryTime: "2023-10-03T09:00:00Z",
                        entryPrice: 50300000,
                        entryKimchiPremium: params.entryRate,
                        exitTime: "2023-10-03T11:00:00Z",
                        exitPrice: 50500000,
                        exitKimchiPremium: params.exitRate,
                        profit: 200000,
                    },
                ];
                totalProfit = mockTrades.reduce(function (sum, trade) { return sum + trade.profit; }, 0);
                winningTrades = mockTrades.filter(function (t) { return t.profit > 0; }).length;
                result = {
                    totalProfit: totalProfit,
                    winRate: (winningTrades / mockTrades.length) * 100,
                    totalTrades: mockTrades.length,
                    averageProfitPerTrade: mockTrades.length > 0 ? totalProfit / mockTrades.length : 0,
                    trades: mockTrades,
                    params: params,
                };
                return [2 /*return*/, result];
            });
        });
    };
    return BacktestService;
}());
export { BacktestService };
