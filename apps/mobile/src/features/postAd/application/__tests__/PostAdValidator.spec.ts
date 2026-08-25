import { PostAdValidator } from '../PostAdValidator';
import { WizardStep } from '../../domain/WizardStep';
import { PostAdDraft } from '../../domain/PostAdDraft';

describe('PostAdValidator', () => {
  it('validates Step 1: Category', () => {
    expect(PostAdValidator.validate(WizardStep.CATEGORY, {}).valid).toBe(false);
    expect(PostAdValidator.validate(WizardStep.CATEGORY, { categoryId: 'cat-1' }).valid).toBe(true);
  });

  it('validates Step 2: Details within SSOT Zod character limits', () => {
    const invalidShortDraft: PostAdDraft = {
      title: 'Short', // < 10 chars
      description: 'Too short', // < 20 chars
      price: 0,
      isFree: false,
    };
    const invalidResult = PostAdValidator.validate(WizardStep.DETAILS, invalidShortDraft);
    expect(invalidResult.valid).toBe(false);

    const validDraft: PostAdDraft = {
      title: 'Apple MacBook Pro M2 16-inch', // 10-80 chars
      description: 'MacBook Pro M2 in working condition with charger and box.', // 20-500 chars
      price: 120000,
      isFree: false,
      locationId: 'loc-1',
      locationDisplay: 'Bengaluru, Karnataka',
    };
    const validResult = PostAdValidator.validate(WizardStep.DETAILS, validDraft);
    expect(validResult.valid).toBe(true);
  });

  it('validates Step 2: Free item allows price 0', () => {
    const freeDraft: PostAdDraft = {
      title: 'Free Working Laptop Charger',
      description: 'Original Apple 67W USB-C charger given away for free.',
      price: 0,
      isFree: true,
      locationId: 'loc-1',
    };
    const result = PostAdValidator.validate(WizardStep.DETAILS, freeDraft);
    expect(result.valid).toBe(true);
  });

  it('validates Step 3: Photos (1 to 5 photos)', () => {
    expect(PostAdValidator.validate(WizardStep.PHOTOS, { localImages: [] }).valid).toBe(false);
    expect(
      PostAdValidator.validate(WizardStep.PHOTOS, {
        localImages: ['file:///img1.jpg'],
      }).valid
    ).toBe(true);
  });

  it('checks isReadyToSubmit across all 3 steps', () => {
    const completeDraft: PostAdDraft = {
      categoryId: 'cat-1',
      title: 'Apple MacBook Pro M2 16-inch',
      description: 'MacBook Pro M2 in working condition with charger and box.',
      price: 120000,
      locationId: 'loc-1',
      localImages: ['file:///img1.jpg'],
    };
    expect(PostAdValidator.isReadyToSubmit(completeDraft)).toBe(true);
  });
});
