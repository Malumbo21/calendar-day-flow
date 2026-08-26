import { fireEvent, render, screen } from '@testing-library/preact';

import { Switch } from '@/components/mobileEventDrawer/components/Switch';

describe('mobile drawer Switch', () => {
  it('toggles checked state when enabled', () => {
    const onChange = vi.fn();

    render(<Switch checked={false} onChange={onChange} />);

    fireEvent.click(screen.getByRole('switch'));

    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('does not toggle when disabled', () => {
    const onChange = vi.fn();

    render(<Switch checked={false} onChange={onChange} disabled />);

    fireEvent.click(screen.getByRole('switch'));

    expect(onChange).not.toHaveBeenCalled();
  });
});
