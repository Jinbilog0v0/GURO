import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TopicSelectionStep } from './TopicSelectionStep';

describe('TopicSelectionStep Component', () => {
    const mockOnSelectTopic = jest.fn();
    const mockOnConnectClassroom = jest.fn();

    const defaultProps = {
        selectedSubject: 'Mathematics',
        selectedGrade: 4,
        isEnglishLocked: false,
        englishLockReason: undefined,
        itemBankLoading: false,
        topics: ['Fractions', 'Decimals'],
        classroomCode: null,
        topicHistory: {
            'Mathematics-4-Fractions': { bestScore: 0.9, lastScore: 0.9, attempts: 2 },
        },
        onSelectTopic: mockOnSelectTopic,
        onConnectClassroom: mockOnConnectClassroom,
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders topic cards with scores and statuses', () => {
        render(<TopicSelectionStep {...defaultProps} />);

        expect(screen.getByText('Math')).toBeInTheDocument();
        expect(screen.getByText('Practice Topics')).toBeInTheDocument();
        expect(screen.getByText('Fractions')).toBeInTheDocument();
        expect(screen.getByText('Decimals')).toBeInTheDocument();
        expect(screen.getByText('Mastered')).toBeInTheDocument();
        expect(screen.getByText('90%')).toBeInTheDocument();
    });

    it('fires onSelectTopic when a topic card is clicked', () => {
        render(<TopicSelectionStep {...defaultProps} />);

        fireEvent.click(screen.getByText('Fractions'));
        expect(mockOnSelectTopic).toHaveBeenCalledWith('Fractions');
    });

    it('displays loading skeletons when itemBankLoading is true', () => {
        const { container } = render(<TopicSelectionStep {...defaultProps} itemBankLoading={true} />);

        const skeletonCards = container.getElementsByClassName('animate-pulse');
        expect(skeletonCards.length).toBeGreaterThan(0);
    });

    it('shows connect to class prompt when topics are empty without classroomCode', () => {
        render(<TopicSelectionStep {...defaultProps} topics={[]} />);

        expect(screen.getByText('Not Connected to a Classroom')).toBeInTheDocument();
        const connectBtn = screen.getByRole('button', { name: /Connect to Class/i });
        fireEvent.click(connectBtn);
        expect(mockOnConnectClassroom).toHaveBeenCalled();
    });

    it('shows English lock banner when English is locked', () => {
        render(
            <TopicSelectionStep
                {...defaultProps}
                selectedSubject="English"
                isEnglishLocked={true}
                englishLockReason="Score at least 80% in Mathematics to unlock English."
            />
        );

        expect(screen.getByText(/Score at least 80% in Mathematics to unlock English/i)).toBeInTheDocument();
    });
});
