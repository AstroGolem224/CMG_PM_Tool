import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import CollapsiblePanel from '@/components/common/CollapsiblePanel';

describe('CollapsiblePanel', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.scrollTo = vi.fn();
  });

  it('collapses and expands its body content', async () => {
    render(
      <CollapsiblePanel
        eyebrow="// saved views"
        title="Board Memories"
        description="persisted slices"
        storageKey="test:board-memories"
      >
        <div>panel body</div>
      </CollapsiblePanel>
    );

    expect(screen.getByText('panel body')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /collapse board memories/i }));
    await waitFor(() => expect(screen.queryByText('panel body')).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /expand board memories/i }));
    expect(screen.getByText('panel body')).toBeInTheDocument();
  });
});
