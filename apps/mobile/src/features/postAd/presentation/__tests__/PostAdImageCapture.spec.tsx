import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { StepImages } from '../steps/StepImages';
import { PostAdProvider } from '../../PostAdProvider';
import { MockImagePicker } from '../../application/IImagePicker';
import { Alert } from 'react-native';

jest.mock('../../../../bootstrap', () => ({
  services: {
    imagePicker: {
      pick: jest.fn().mockResolvedValue({
        success: true,
        images: [{ uri: 'file:///photo1.jpg', mimeType: 'image/jpeg', name: 'photo1.jpg' }],
      }),
      captureFromCamera: jest.fn().mockResolvedValue({
        success: true,
        images: [{ uri: 'file:///camera1.jpg', mimeType: 'image/jpeg', name: 'camera1.jpg' }],
      }),
    },
  },
}));

jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  return new Proxy({}, { get: () => View });
});

describe('PostAd Image Capture & Selection Parity', () => {
  it('MockImagePicker correctly returns gallery and camera capture images', async () => {
    const picker = new MockImagePicker();
    const galleryResult = await picker.pick();
    expect(galleryResult.success).toBe(true);
    if (galleryResult.success) {
      expect(galleryResult.images[0]?.uri).toBe('mock://image-1');
    }

    const cameraResult = await picker.captureFromCamera();
    expect(cameraResult.success).toBe(true);
    if (cameraResult.success) {
      expect(cameraResult.images[0]?.uri).toBe('mock://camera-1');
    }
  });

  it('renders StepImages and triggers Add Photo source alert dialog', () => {
    const alertSpy = jest.spyOn(Alert, 'alert');

    const { getByLabelText, getByText } = render(
      <PostAdProvider>
        <StepImages />
      </PostAdProvider>
    );

    expect(getByText('Add Photos')).toBeTruthy();
    expect(getByText('Upload at least 1 photo')).toBeTruthy();

    const addButton = getByLabelText('Add photo');
    fireEvent.press(addButton);

    expect(alertSpy).toHaveBeenCalledWith(
      'Add Photo',
      'Choose how you want to add photos to your listing',
      expect.arrayContaining([
        expect.objectContaining({ text: 'Take Photo' }),
        expect.objectContaining({ text: 'Choose from Gallery' }),
        expect.objectContaining({ text: 'Cancel', style: 'cancel' }),
      ])
    );

    alertSpy.mockRestore();
  });
});
