import { PartialType } from '@nestjs/swagger';
import { CreatePtbaeApplicationDto } from './create-ptbae-application.dto';

export class UpdatePtbaeApplicationDto extends PartialType(
  CreatePtbaeApplicationDto,
) {}
