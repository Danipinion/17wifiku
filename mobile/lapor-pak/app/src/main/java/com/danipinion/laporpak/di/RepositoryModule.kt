package com.danipinion.laporpak.di

import com.danipinion.laporpak.data.repository.JobRepositoryImpl
import com.danipinion.laporpak.domain.repository.JobRepository
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {

    @Binds
    @Singleton
    abstract fun bindJobRepository(
        jobRepositoryImpl: JobRepositoryImpl
    ): JobRepository

    @Binds
    @Singleton
    abstract fun bindAuthRepository(
        authRepositoryImpl: com.danipinion.laporpak.data.repository.AuthRepositoryImpl
    ): com.danipinion.laporpak.domain.repository.AuthRepository

    @Binds
    @Singleton
    abstract fun bindDashboardRepository(
        dashboardRepositoryImpl: com.danipinion.laporpak.data.repository.DashboardRepositoryImpl
    ): com.danipinion.laporpak.domain.repository.DashboardRepository
}
