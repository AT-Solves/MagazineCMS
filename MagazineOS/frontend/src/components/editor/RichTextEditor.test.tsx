import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RichTextEditor } from './RichTextEditor';
import { vi } from 'vitest';

describe('RichTextEditor Component', () => {
  const mockOnChange = vi.fn();
  const mockContent = {
    blocks: [
      {
        key: 'test-key',
        text: 'Test content',
        type: 'unstyled',
        depth: 0,
        inlineStyleRanges: [],
        entityRanges: [],
        data: {},
      },
    ],
    entityMap: {},
  };

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('should render the editor', () => {
    render(
      <RichTextEditor
        value={mockContent}
        onChange={mockOnChange}
        placeholder="Enter content..."
      />,
    );

    expect(screen.getByPlaceholderText('Enter content...')).toBeInTheDocument();
  });

  it('should display toolbar with formatting options', () => {
    render(
      <RichTextEditor
        value={mockContent}
        onChange={mockOnChange}
        placeholder="Enter content..."
      />,
    );

    expect(screen.getByRole('button', { name: /bold/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /italic/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /underline/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /link/i })).toBeInTheDocument();
  });

  it('should apply bold formatting', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <RichTextEditor
        value={mockContent}
        onChange={mockOnChange}
        placeholder="Enter content..."
      />,
    );

    const boldButton = screen.getByRole('button', { name: /bold/i });
    await user.click(boldButton);

    expect(mockOnChange).toHaveBeenCalled();
  });

  it('should handle text input', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <RichTextEditor
        value={mockContent}
        onChange={mockOnChange}
        placeholder="Enter content..."
      />,
    );

    const editor = container.querySelector('[contenteditable="true"]');
    expect(editor).toBeInTheDocument();

    if (editor) {
      await user.click(editor);
      await user.keyboard('New text');
      expect(mockOnChange).toHaveBeenCalled();
    }
  });

  it('should support undo/redo', async () => {
    const user = userEvent.setup();
    render(
      <RichTextEditor
        value={mockContent}
        onChange={mockOnChange}
        placeholder="Enter content..."
      />,
    );

    const undoButton = screen.getByRole('button', { name: /undo/i });
    const redoButton = screen.getByRole('button', { name: /redo/i });

    expect(undoButton).toBeInTheDocument();
    expect(redoButton).toBeInTheDocument();

    await user.click(undoButton);
    expect(mockOnChange).toHaveBeenCalled();

    await user.click(redoButton);
    expect(mockOnChange).toHaveBeenCalled();
  });

  it('should handle image insertion', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <RichTextEditor
        value={mockContent}
        onChange={mockOnChange}
        placeholder="Enter content..."
      />,
    );

    const imageButton = screen.getByRole('button', { name: /image/i });
    await user.click(imageButton);

    // Should open image dialog or file picker
    await waitFor(() => {
      const dialog = screen.queryByRole('dialog');
      expect(dialog).toBeInTheDocument();
    });
  });

  it('should handle link insertion', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <RichTextEditor
        value={mockContent}
        onChange={mockOnChange}
        placeholder="Enter content..."
      />,
    );

    const linkButton = screen.getByRole('button', { name: /link/i });
    await user.click(linkButton);

    await waitFor(() => {
      const linkDialog = screen.queryByRole('dialog');
      expect(linkDialog).toBeInTheDocument();
    });

    const urlInput = screen.getByPlaceholderText(/URL/i);
    await user.type(urlInput, 'https://example.com');

    const addLinkButton = screen.getByRole('button', { name: /add|insert/i });
    await user.click(addLinkButton);

    expect(mockOnChange).toHaveBeenCalled();
  });

  it('should display character count', () => {
    render(
      <RichTextEditor
        value={mockContent}
        onChange={mockOnChange}
        placeholder="Enter content..."
        showCharCount={true}
      />,
    );

    const charCount = screen.getByText(/characters/i);
    expect(charCount).toBeInTheDocument();
  });

  it('should handle word count', () => {
    render(
      <RichTextEditor
        value={mockContent}
        onChange={mockOnChange}
        placeholder="Enter content..."
        showWordCount={true}
      />,
    );

    const wordCount = screen.getByText(/words/i);
    expect(wordCount).toBeInTheDocument();
  });

  it('should support read-only mode', () => {
    const { container } = render(
      <RichTextEditor
        value={mockContent}
        onChange={mockOnChange}
        placeholder="Enter content..."
        readOnly={true}
      />,
    );

    const editor = container.querySelector('[contenteditable="true"]');
    expect(editor).not.toBeInTheDocument();
  });

  it('should apply custom CSS classes', () => {
    const { container } = render(
      <RichTextEditor
        value={mockContent}
        onChange={mockOnChange}
        placeholder="Enter content..."
        className="custom-editor"
      />,
    );

    const editor = container.querySelector('.custom-editor');
    expect(editor).toBeInTheDocument();
  });

  it('should handle paste events', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <RichTextEditor
        value={mockContent}
        onChange={mockOnChange}
        placeholder="Enter content..."
      />,
    );

    const editor = container.querySelector('[contenteditable="true"]');
    if (editor) {
      const pasteEvent = new ClipboardEvent('paste', {
        clipboardData: new DataTransfer(),
      });
      pasteEvent.clipboardData?.setData('text/plain', 'Pasted text');

      fireEvent(editor, pasteEvent);
      expect(mockOnChange).toHaveBeenCalled();
    }
  });

  it('should validate max length', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <RichTextEditor
        value={mockContent}
        onChange={mockOnChange}
        placeholder="Enter content..."
        maxLength={100}
      />,
    );

    const editor = container.querySelector('[contenteditable="true"]');
    if (editor) {
      await user.click(editor);
      // Attempt to add content exceeding max length
      const longText = 'a'.repeat(150);
      await user.keyboard(longText);

      // Should not allow content beyond max length
      expect(editor.textContent?.length).toBeLessThanOrEqual(100);
    }
  });
});
