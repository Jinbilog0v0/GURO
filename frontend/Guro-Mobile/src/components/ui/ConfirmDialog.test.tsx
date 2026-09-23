import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { ConfirmDialog } from './ConfirmDialog';

describe('ConfirmDialog Component', () => {
  test('renders correctly when visible', async () => {
    let tree: renderer.ReactTestRenderer | undefined;
    await act(async () => {
      tree = renderer.create(
        <ConfirmDialog
          visible={true}
          title="Delete Section?"
          message="Are you sure you want to delete this section?"
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
          onConfirm={() => {}}
          onCancel={() => {}}
        />
      );
    });
    expect(tree!.toJSON()).toBeDefined();
  });

  test('renders correctly with different variants', async () => {
    let tree: renderer.ReactTestRenderer | undefined;
    await act(async () => {
      tree = renderer.create(
        <ConfirmDialog
          visible={true}
          title="Notice"
          message="Important classroom notification."
          variant="warning"
          onConfirm={() => {}}
          onCancel={() => {}}
        />
      );
    });
    expect(tree!.toJSON()).toBeDefined();
  });
});
