package com.danipinion.sobatwiff.model

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import java.util.*

data class Notification(
    val id: String = UUID.randomUUID().toString(),
    val title: String,
    val message: String,
    val time: String,
    val type: NotificationType,
    var isRead: Boolean = false,
    val date: String = "15 Mar 2024"
)

enum class NotificationType(
    val icon: ImageVector,
    val color: Color
) {
    INFO(Icons.Default.Info, Color(0xFF2196F3)),
    SUCCESS(Icons.Default.CheckCircle, Color(0xFF4CAF50)),
    WARNING(Icons.Default.Warning, Color(0xFFFF9800)),
    ERROR(Icons.Default.Error, Color(0xFFF44336)),
    PROMO(Icons.Default.CardGiftcard, Color(0xFF9C27B0)),
    BILLING(Icons.Default.ReceiptLong, Color(0xFFE91E63))
}

object NotificationStore {
    private val _notifications = mutableStateListOf(
        Notification(
            title = "Pembayaran Berhasil",
            message = "Tagihan periode Maret 2024 sebesar Rp 250.000 telah berhasil dibayarkan. Terima kasih!",
            time = "10:30 WIB",
            type = NotificationType.SUCCESS
        ),
        Notification(
            title = "Promo Terbatas!",
            message = "Dapatkan potongan 50% untuk upgrade ke paket Home Deluxe 100Mbps hanya di bulan ini.",
            time = "Yesterday",
            type = NotificationType.PROMO
        ),
        Notification(
            title = "Peringatan Jatuh Tempo",
            message = "Tagihan Anda akan jatuh tempo dalam 3 hari lagi. Segera lakukan pembayaran untuk menghindari denda.",
            time = "Yesterday",
            type = NotificationType.WARNING,
            isRead = true
        ),
        Notification(
            title = "Sistem Maintenance",
            message = "Akan dilakukan pemeliharaan sistem pada pukul 00:00 - 04:00 WIB. Koneksi mungkin akan terganggu.",
            time = "2 days ago",
            type = NotificationType.INFO,
            isRead = true
        ),
        Notification(
            title = "Bonus Referral Cair!",
            message = "Teman Anda (Budi) baru saja membayar tagihan pertama. Bonus Rp 25.000 telah masuk ke saldo Anda.",
            time = "3 days ago",
            type = NotificationType.SUCCESS,
            isRead = true
        )
    )

    val notifications: List<Notification> get() = _notifications

    val unreadCount: Int get() = _notifications.count { !it.isRead }

    fun markAllAsRead() {
        _notifications.forEachIndexed { index, notification ->
            _notifications[index] = notification.copy(isRead = true)
        }
    }

    fun deleteAll() {
        _notifications.clear()
    }
    
    fun deleteNotification(id: String) {
        _notifications.removeIf { it.id == id }
    }

    fun markAsRead(id: String) {
        val index = _notifications.indexOfFirst { it.id == id }
        if (index != -1) {
            _notifications[index] = _notifications[index].copy(isRead = true)
        }
    }
}
