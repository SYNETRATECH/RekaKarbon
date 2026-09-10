import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { IssueReportTargetType, IssueReportStatus } from '@prisma/client';

export class CreateIssueReportDto {
  @IsEnum(IssueReportTargetType)
  @IsNotEmpty()
  targetType!: IssueReportTargetType;

  @IsString()
  @IsNotEmpty()
  targetId!: string;

  @IsString()
  @IsNotEmpty()
  targetName!: string;

  @IsString()
  @IsNotEmpty()
  category!: string;

  @IsString()
  @IsOptional()
  reporterName?: string;

  @IsString()
  @IsOptional()
  reporterEmail?: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsString()
  @IsOptional()
  evidenceUrl?: string;
}

export class UpdateIssueReportStatusDto {
  @IsEnum(IssueReportStatus)
  @IsNotEmpty()
  status!: IssueReportStatus;

  @IsString()
  @IsOptional()
  regulatorNotes?: string;
}
