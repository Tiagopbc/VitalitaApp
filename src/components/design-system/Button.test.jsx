import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';
import React from 'react';

describe('Button', () => {
    it('renders children correctly', () => {
        render(<Button>Click Me</Button>);
        expect(screen.getByText('Click Me')).toBeInTheDocument();
    });

    it('calls onClick handler when clicked', () => {
        const handleClick = vi.fn();
        render(<Button onClick={handleClick}>Action</Button>);

        fireEvent.click(screen.getByText('Action'));
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('is disabled when loading prop is true', () => {
        render(<Button loading>Loading</Button>);
        const button = screen.getByRole('button');
        expect(button).toBeDisabled();
    });

    it('applies variant classes', () => {
        render(<Button variant="danger">Delete</Button>);
        const button = screen.getByRole('button');
        // Check for parts of the danger variant class
        expect(button.className).toContain('bg-[radial-gradient(circle_at_top_left,#ef4444_0%,#dc2626_42%,#991b1b_100%)]');
    });
});
