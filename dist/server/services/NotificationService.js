import { BaseRepository } from '../repositories/BaseRepository.js';
import { NotificationType, ErrorSeverity } from '../types/error-tracking.js';
/**
 * 거래 오류 알림 서비스
 */
export class NotificationService extends BaseRepository {
    // 알림 제한 설정 (같은 패턴 오류에 대한 스팸 방지)
    notificationThrottleMs = 15 * 60 * 1000; // 15분
    lastNotifications = new Map();
    constructor() {
        super(); // BaseRepository 초기화
    }
    /**
     * 오류 발생 시 알림 발송
     */
    async sendErrorNotification(tradingError) {
        try {
            // 알림 발송 여부 확인
            if (!this.shouldSendNotification(tradingError)) {
                return;
            }
            // 알림 제한 확인 (스팸 방지)
            if (this.isThrottled(tradingError)) {
                console.log(`⏰ [Notification] 알림 제한: ${tradingError.errorSignature} (15분 내 중복)`);
                return;
            }
            // 다양한 채널로 알림 발송
            const notifications = await Promise.allSettled([
                this.sendSlackNotification(tradingError),
                this.sendEmailNotification(tradingError),
                this.sendWebhookNotification(tradingError),
                this.sendDashboardNotification(tradingError)
            ]);
            // 발송 결과 로깅
            notifications.forEach((result, index) => {
                const channels = ['Slack', 'Email', 'Webhook', 'Dashboard'];
                if (result.status === 'fulfilled') {
                    console.log(`✅ [Notification] ${channels[index]} 알림 발송 성공`);
                }
                else {
                    console.error(`❌ [Notification] ${channels[index]} 알림 발송 실패:`, result.reason);
                }
            });
            // 제한 기록 업데이트
            if (tradingError.errorSignature) {
                this.lastNotifications.set(tradingError.errorSignature, Date.now());
            }
        }
        catch (error) {
            console.error('❌ [Notification] 알림 발송 중 오류:', error);
        }
    }
    /**
     * 알림 발송 여부 결정
     */
    shouldSendNotification(tradingError) {
        // 심각도 기반 필터링
        const severityThreshold = [ErrorSeverity.HIGH, ErrorSeverity.CRITICAL];
        if (!severityThreshold.includes(tradingError.errorSeverity)) {
            return false;
        }
        // 이미 해결된 오류는 알림 발송하지 않음
        if (tradingError.isResolved) {
            return false;
        }
        return true;
    }
    /**
     * 알림 제한 확인 (스팸 방지)
     */
    isThrottled(tradingError) {
        if (!tradingError.errorSignature) {
            return false;
        }
        const lastNotification = this.lastNotifications.get(tradingError.errorSignature);
        if (!lastNotification) {
            return false;
        }
        const timeSinceLastNotification = Date.now() - lastNotification;
        return timeSinceLastNotification < this.notificationThrottleMs;
    }
    /**
     * 슬랙 알림 발송
     */
    async sendSlackNotification(tradingError) {
        const webhookUrl = process.env.SLACK_WEBHOOK_URL;
        if (!webhookUrl) {
            console.log('ℹ️ [Notification] Slack webhook URL 없음 - 건너뛰기');
            return;
        }
        const message = this.formatSlackMessage(tradingError);
        try {
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(message)
            });
            if (!response.ok) {
                throw new Error(`Slack API Error: ${response.status}`);
            }
            // 알림 기록 저장
            await this.saveNotificationRecord(tradingError.id, NotificationType.SLACK, 'slack-channel', true);
        }
        catch (error) {
            console.error('❌ [Notification] Slack 발송 실패:', error);
            await this.saveNotificationRecord(tradingError.id, NotificationType.SLACK, 'slack-channel', false, error.message);
            throw error;
        }
    }
    /**
     * 이메일 알림 발송
     */
    async sendEmailNotification(tradingError) {
        const emailRecipients = process.env.ERROR_EMAIL_RECIPIENTS;
        if (!emailRecipients) {
            console.log('ℹ️ [Notification] 이메일 수신자 없음 - 건너뛰기');
            return;
        }
        // TODO: 실제 이메일 발송 로직 구현 (SendGrid, AWS SES 등)
        console.log(`📧 [Notification] 이메일 발송 시뮬레이션: ${emailRecipients}`);
        console.log(`   제목: 거래 오류 발생 - ${tradingError.errorSeverity.toUpperCase()}`);
        console.log(`   내용: ${tradingError.exchange}에서 ${tradingError.symbol} 거래 중 오류 발생`);
        // 알림 기록 저장
        await this.saveNotificationRecord(tradingError.id, NotificationType.EMAIL, emailRecipients, true);
    }
    /**
     * 웹훅 알림 발송
     */
    async sendWebhookNotification(tradingError) {
        const webhookUrl = process.env.ERROR_WEBHOOK_URL;
        if (!webhookUrl) {
            console.log('ℹ️ [Notification] 웹훅 URL 없음 - 건너뛰기');
            return;
        }
        const payload = {
            type: 'trading_error',
            severity: tradingError.errorSeverity,
            exchange: tradingError.exchange,
            symbol: tradingError.symbol,
            message: tradingError.errorMessage,
            timestamp: tradingError.createdAt,
            errorId: tradingError.id,
            userId: tradingError.userId
        };
        try {
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'TradingBot-ErrorNotification/1.0'
                },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                throw new Error(`Webhook Error: ${response.status}`);
            }
            await this.saveNotificationRecord(tradingError.id, NotificationType.WEBHOOK, webhookUrl, true);
        }
        catch (error) {
            console.error('❌ [Notification] 웹훅 발송 실패:', error);
            await this.saveNotificationRecord(tradingError.id, NotificationType.WEBHOOK, webhookUrl, false, error.message);
            throw error;
        }
    }
    /**
     * 대시보드 알림 (실시간 업데이트)
     */
    async sendDashboardNotification(tradingError) {
        // TODO: WebSocket이나 Server-Sent Events를 통한 실시간 대시보드 업데이트
        console.log(`📊 [Notification] 대시보드 실시간 업데이트: 오류 ID ${tradingError.id}`);
        // 알림 기록 저장
        await this.saveNotificationRecord(tradingError.id, NotificationType.DASHBOARD, 'dashboard', true);
    }
    /**
     * 슬랙 메시지 포맷팅
     */
    formatSlackMessage(tradingError) {
        const severityEmojis = {
            [ErrorSeverity.LOW]: '🟡',
            [ErrorSeverity.MEDIUM]: '🟠',
            [ErrorSeverity.HIGH]: '🔴',
            [ErrorSeverity.CRITICAL]: '🚨'
        };
        const emoji = severityEmojis[tradingError.errorSeverity];
        return {
            text: `${emoji} 거래 오류 발생`,
            blocks: [
                {
                    type: 'header',
                    text: {
                        type: 'plain_text',
                        text: `${emoji} 거래 오류 발생 - ${tradingError.errorSeverity.toUpperCase()}`
                    }
                },
                {
                    type: 'section',
                    fields: [
                        {
                            type: 'mrkdwn',
                            text: `*거래소:* ${tradingError.exchange}`
                        },
                        {
                            type: 'mrkdwn',
                            text: `*심볼:* ${tradingError.symbol}`
                        },
                        {
                            type: 'mrkdwn',
                            text: `*거래 방향:* ${tradingError.side}`
                        },
                        {
                            type: 'mrkdwn',
                            text: `*사용자 ID:* ${tradingError.userId}`
                        }
                    ]
                },
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: `*오류 메시지:*\n\`\`\`${tradingError.errorMessage}\`\`\``
                    }
                },
                {
                    type: 'context',
                    elements: [
                        {
                            type: 'mrkdwn',
                            text: `발생 시간: ${tradingError.createdAt?.toISOString()} | 오류 ID: ${tradingError.id}`
                        }
                    ]
                }
            ]
        };
    }
    /**
     * 알림 기록 저장
     */
    async saveNotificationRecord(tradingErrorId, type, recipient, success, error) {
        try {
            const query = `
        INSERT INTO error_notifications (
          trading_error_id, notification_type, recipient, subject, message,
          sent_at, delivery_status, delivery_error
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `;
            const values = [
                tradingErrorId,
                type,
                recipient,
                '거래 오류 알림',
                '거래 중 오류가 발생했습니다.',
                success ? new Date() : null,
                success ? 'sent' : 'failed',
                error || null
            ];
            await this.queryOne(query, values);
        }
        catch (dbError) {
            console.error('❌ [Notification] 알림 기록 저장 실패:', dbError);
        }
    }
    /**
     * 대량 알림 발송 (배치 처리)
     */
    async sendBatchNotifications(tradingErrors) {
        let success = 0;
        let failed = 0;
        let skipped = 0;
        for (const error of tradingErrors) {
            try {
                if (this.shouldSendNotification(error)) {
                    await this.sendErrorNotification(error);
                    success++;
                }
                else {
                    skipped++;
                }
                // 과부하 방지를 위한 지연
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            catch (notificationError) {
                console.error(`❌ [Notification] 배치 알림 실패 (오류 ID: ${error.id}):`, notificationError);
                failed++;
            }
        }
        console.log(`📊 [Notification] 배치 알림 완료: 성공 ${success}, 실패 ${failed}, 건너뛰기 ${skipped}`);
        return { success, failed, skipped };
    }
    /**
     * 실패한 알림 재발송
     */
    async retryFailedNotifications() {
        try {
            const query = `
        SELECT 
          en.*,
          te.error_severity,
          te.error_message,
          te.exchange,
          te.symbol,
          te.user_id
        FROM error_notifications en
        JOIN trading_errors te ON en.trading_error_id = te.id
        WHERE en.delivery_status = 'failed'
          AND en.created_at >= NOW() - INTERVAL '24 hours'
        ORDER BY en.created_at DESC
        LIMIT 50
      `;
            const failedNotifications = await this.queryMany(query, []);
            console.log(`🔄 [Notification] 실패한 알림 ${failedNotifications.length}건 재발송 시작`);
            for (const notification of failedNotifications) {
                try {
                    // 원본 오류 정보 재구성
                    const tradingError = {
                        id: notification.trading_error_id,
                        userId: notification.user_id,
                        errorSeverity: notification.error_severity,
                        errorMessage: notification.error_message,
                        exchange: notification.exchange,
                        symbol: notification.symbol,
                        errorSignature: notification.error_signature,
                        // ... 기타 필드들
                    };
                    // 알림 재발송
                    await this.sendErrorNotification(tradingError);
                    // 성공 시 상태 업데이트
                    await this.updateNotificationStatus(notification.id, 'sent');
                }
                catch (retryError) {
                    console.error(`❌ [Notification] 재발송 실패 (알림 ID: ${notification.id}):`, retryError);
                }
                // 과부하 방지
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        }
        catch (error) {
            console.error('❌ [Notification] 실패한 알림 재발송 중 오류:', error);
        }
    }
    /**
     * 알림 상태 업데이트
     */
    async updateNotificationStatus(notificationId, status) {
        const query = `
      UPDATE error_notifications 
      SET delivery_status = $1, sent_at = $2, updated_at = NOW()
      WHERE id = $3
    `;
        await this.queryOne(query, [
            status,
            status === 'sent' ? new Date() : null,
            notificationId
        ]);
    }
    /**
     * 알림 통계 조회
     */
    async getNotificationStats(days = 7) {
        const query = `
      SELECT 
        COUNT(*) as total_notifications,
        COUNT(CASE WHEN delivery_status = 'sent' THEN 1 END) as successful_notifications,
        COUNT(CASE WHEN delivery_status = 'failed' THEN 1 END) as failed_notifications,
        COUNT(CASE WHEN notification_type = 'email' THEN 1 END) as email_notifications,
        COUNT(CASE WHEN notification_type = 'slack' THEN 1 END) as slack_notifications,
        COUNT(CASE WHEN notification_type = 'webhook' THEN 1 END) as webhook_notifications,
        COUNT(CASE WHEN notification_type = 'dashboard' THEN 1 END) as dashboard_notifications
      FROM error_notifications en
      JOIN trading_errors te ON en.trading_error_id = te.id
      WHERE en.created_at >= NOW() - INTERVAL '$1 days'
    `;
        const result = await this.queryOne(query, [days]);
        if (!result) {
            return {
                totalNotifications: 0,
                successfulNotifications: 0,
                failedNotifications: 0,
                successRate: 0,
                notificationsByType: {},
                notificationsBySeverity: {}
            };
        }
        const total = parseInt(result.total_notifications || '0');
        const successful = parseInt(result.successful_notifications || '0');
        return {
            totalNotifications: total,
            successfulNotifications: successful,
            failedNotifications: parseInt(result.failed_notifications || '0'),
            successRate: total > 0 ? Math.round((successful / total) * 100) : 0,
            notificationsByType: {
                email: parseInt(result.email_notifications || '0'),
                slack: parseInt(result.slack_notifications || '0'),
                webhook: parseInt(result.webhook_notifications || '0'),
                dashboard: parseInt(result.dashboard_notifications || '0')
            },
            notificationsBySeverity: {} // TODO: 심각도별 통계 추가
        };
    }
    /**
     * 주기적 알림 정리 (오래된 기록 삭제)
     */
    async cleanupOldNotifications(days = 90) {
        const query = `
      DELETE FROM error_notifications 
      WHERE created_at < NOW() - INTERVAL '$1 days'
    `;
        try {
            const result = await this.pool.query(query, [days]);
            const deletedCount = result.rowCount || 0;
            console.log(`🗑️ [Notification] ${days}일 이전 알림 기록 ${deletedCount}건 정리`);
            return deletedCount;
        }
        catch (error) {
            console.error('❌ [Notification] 알림 기록 정리 실패:', error);
            throw error;
        }
    }
}
