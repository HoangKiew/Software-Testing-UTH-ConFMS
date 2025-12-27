import { Module } from '@nestjs/common';
import { ConferenceClient } from './conference.client';
import { ReviewClient } from './review.client';

@Module({
    providers: [ConferenceClient, ReviewClient],
    exports: [ConferenceClient, ReviewClient],
})
export class IntegrationModule { }
