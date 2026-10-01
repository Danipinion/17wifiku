package com.danipinion.sobatwiff.data.local

import androidx.room.*

@Dao
interface UserDao {
    @Query("SELECT * FROM user_cache LIMIT 1")
    suspend fun getUser(): UserCache?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertUser(user: UserCache)

    @Query("DELETE FROM user_cache")
    suspend fun clearUser()
}
