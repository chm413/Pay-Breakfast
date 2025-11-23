import { IsArray, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ClassGroupOrderItemDto {
  @IsNumber()
  studentId!: number;

  @IsNumber()
  amount!: number;

  @IsOptional()
  @IsNumber()
  productId?: number;
}

export class CreateClassGroupOrderDto {
  @IsNumber()
  classAccountId!: number;

  @IsOptional()
  @IsString()
  remark?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClassGroupOrderItemDto)
  items!: ClassGroupOrderItemDto[];
}
