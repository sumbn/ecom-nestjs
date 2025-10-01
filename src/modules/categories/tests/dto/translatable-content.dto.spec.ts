import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { TranslatableContentDto } from '../../../../common/dto/translatable-content.dto';

describe('TranslatableContentDto', () => {
  it('should pass with only en', async () => {
    const dto = plainToInstance(TranslatableContentDto, {
      en: 'Electronics',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should pass with only vi', async () => {
    const dto = plainToInstance(TranslatableContentDto, {
      vi: 'Điện tử',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should pass with both en and vi', async () => {
    const dto = plainToInstance(TranslatableContentDto, {
      en: 'Electronics',
      vi: 'Điện tử',
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail with empty object', async () => {
    const dto = plainToInstance(TranslatableContentDto, {});

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with empty strings', async () => {
    const dto = plainToInstance(TranslatableContentDto, {
      en: '',
      vi: '',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail with non-string values', async () => {
    const dto = plainToInstance(TranslatableContentDto, {
      en: 123,
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
