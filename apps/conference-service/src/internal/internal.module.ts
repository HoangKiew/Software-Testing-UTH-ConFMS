import { Module } from '@nestjs/common';
import { InternalController } from './internal.controller';
import { ConferencesModule } from '../conferences/conferences.module';

@Module({
    imports: [ConferencesModule],
    controllers: [InternalController],
})
export class InternalModule { }
