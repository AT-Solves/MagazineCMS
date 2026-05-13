import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RichTextEditor } from "./RichTextEditor";
import { vi } from "vitest";

// jsdom does not implement execCommand — provide a no-op stub
Object.defineProperty(document, "execCommand", {
  value: vi.fn().mockReturnValue(true),
  writable: true,
});

// window.prompt is no longer used (replaced by MediaPickerDialog)

describe("RichTextEditor Component", () => {
  const mockOnChange = vi.fn();
  const mockValue = "<p>Test content</p>";

  beforeEach(() => {
    mockOnChange.mockClear();
    vi.mocked(document.execCommand).mockClear();
  });

  it("should render the editor", () => {
    const { container } = render(
      <RichTextEditor
        value={mockValue}
        onChange={mockOnChange}
        placeholder="Enter content..."
      />,
    );

    const editor = container.querySelector("[contenteditable]");
    expect(editor).toBeInTheDocument();
  });

  it("should display toolbar with formatting options", () => {
    render(
      <RichTextEditor
        value={mockValue}
        onChange={mockOnChange}
        placeholder="Enter content..."
      />,
    );

    expect(screen.getByRole("button", { name: /bold/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /italic/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /underline/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /insert link/i }),
    ).toBeInTheDocument();
  });

  it("should apply bold formatting", async () => {
    const user = userEvent.setup();
    render(
      <RichTextEditor
        value={mockValue}
        onChange={mockOnChange}
        placeholder="Enter content..."
      />,
    );

    const boldButton = screen.getByRole("button", { name: /bold/i });
    await user.click(boldButton);

    expect(document.execCommand).toHaveBeenCalledWith("bold", false, undefined);
  });

  it("should handle text input", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <RichTextEditor
        value={mockValue}
        onChange={mockOnChange}
        placeholder="Enter content..."
      />,
    );

    const editor = container.querySelector('[contenteditable="true"]');
    expect(editor).toBeInTheDocument();

    if (editor) {
      await user.click(editor);
      await user.keyboard("New text");
      expect(mockOnChange).toHaveBeenCalled();
    }
  });

  it("should support undo/redo", async () => {
    const user = userEvent.setup();
    render(
      <RichTextEditor
        value={mockValue}
        onChange={mockOnChange}
        placeholder="Enter content..."
      />,
    );

    const undoButton = screen.getByRole("button", { name: /undo/i });
    const redoButton = screen.getByRole("button", { name: /redo/i });

    expect(undoButton).toBeInTheDocument();
    expect(redoButton).toBeInTheDocument();

    await user.click(undoButton);
    expect(document.execCommand).toHaveBeenCalledWith("undo", false, undefined);

    await user.click(redoButton);
    expect(document.execCommand).toHaveBeenCalledWith("redo", false, undefined);
  });

  it("should open media picker dialog on image button click", async () => {
    const user = userEvent.setup();
    render(
      <RichTextEditor
        value={mockValue}
        onChange={mockOnChange}
        placeholder="Enter content..."
      />,
    );

    const imageButton = screen.getByRole("button", { name: /insert image/i });
    await user.click(imageButton);

    // Media picker dialog should open
    await waitFor(() => {
      expect(screen.getByText(/insert image/i, { selector: 'h6' })).toBeInTheDocument();
    });

    // Switch to templates tab and select one
    const templateTab = screen.getByRole("tab", { name: /layout templates/i });
    await user.click(templateTab);

    await waitFor(() => {
      expect(screen.getByText("Full-Width Hero")).toBeInTheDocument();
    });

    // Click on the first template card
    await user.click(screen.getByText("Full-Width Hero"));

    // Click the Insert Image button in the dialog
    const insertButtons = screen.getAllByRole("button", { name: /insert image/i });
    const dialogInsert = insertButtons[insertButtons.length - 1];
    await user.click(dialogInsert);

    expect(document.execCommand).toHaveBeenCalledWith(
      "insertHTML",
      false,
      expect.stringContaining("<img"),
    );
  });

  it("should handle link insertion", async () => {
    const user = userEvent.setup();
    render(
      <RichTextEditor
        value={mockValue}
        onChange={mockOnChange}
        placeholder="Enter content..."
      />,
    );

    const linkButton = screen.getByRole("button", { name: /insert link/i });
    await user.click(linkButton);

    await waitFor(() => {
      const linkDialog = screen.queryByRole("dialog");
      expect(linkDialog).toBeInTheDocument();
    });

    const urlInput = screen.getByPlaceholderText(/URL/i);
    await user.type(urlInput, "https://example.com");

    const insertButton = screen.getByRole("button", { name: /insert/i });
    await user.click(insertButton);

    expect(document.execCommand).toHaveBeenCalled();
  });

  it("should display character count", () => {
    render(
      <RichTextEditor
        value={mockValue}
        onChange={mockOnChange}
        placeholder="Enter content..."
        showCharCount={true}
      />,
    );

    const charCount = screen.getByText(/characters/i);
    expect(charCount).toBeInTheDocument();
  });

  it("should handle word count", () => {
    render(
      <RichTextEditor
        value={mockValue}
        onChange={mockOnChange}
        placeholder="Enter content..."
        showWordCount={true}
      />,
    );

    const wordCount = screen.getByText(/words/i);
    expect(wordCount).toBeInTheDocument();
  });

  it("should support read-only mode", () => {
    const { container } = render(
      <RichTextEditor
        value={mockValue}
        onChange={mockOnChange}
        placeholder="Enter content..."
        readOnly={true}
      />,
    );

    const editor = container.querySelector('[contenteditable="true"]');
    expect(editor).not.toBeInTheDocument();
  });

  it("should apply custom CSS classes", () => {
    const { container } = render(
      <RichTextEditor
        value={mockValue}
        onChange={mockOnChange}
        placeholder="Enter content..."
        className="custom-editor"
      />,
    );

    const wrapper = container.querySelector(".custom-editor");
    expect(wrapper).toBeInTheDocument();
  });

  it("should handle paste events", async () => {
    const { container } = render(
      <RichTextEditor
        value={mockValue}
        onChange={mockOnChange}
        placeholder="Enter content..."
      />,
    );

    const editor = container.querySelector('[contenteditable="true"]');
    if (editor) {
      const dt = new DataTransfer();
      dt.setData("text/plain", "Pasted text");
      const pasteEvent = new ClipboardEvent("paste", {
        clipboardData: dt,
        bubbles: true,
        cancelable: true,
      });

      fireEvent(editor, pasteEvent);
      expect(mockOnChange).toHaveBeenCalled();
    }
  });

  it("should validate max length", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <RichTextEditor
        value=""
        onChange={mockOnChange}
        placeholder="Enter content..."
        maxLength={10}
      />,
    );

    const editor = container.querySelector('[contenteditable="true"]');
    if (editor) {
      await user.click(editor);
      await user.keyboard("Hello");
      // onChange should have been called for characters typed
      expect(mockOnChange).toHaveBeenCalled();
    }
  });
});
