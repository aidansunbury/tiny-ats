import type React from "react";
import {
	type ReactNode,
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";

interface SelectedItemContextType {
	selectedItemId: string;
	selectedItemContent: any;
	setSelectedItemId: (id: string) => void;
	setSelectedItemContent: (content: any) => void;
	isSelected: (id: string) => boolean;
	submitQueue: () => void;
	updateQueueAfterSuccess: () => void;
	queue: any[];
	queueDeletion: (id: string) => void;
	queueNewField: (field: any) => void;
}

const SelectedItemContext = createContext<SelectedItemContextType | undefined>(
	undefined,
);

interface SelectedItemProviderProps {
	children: ReactNode;
	captureState: (itemId: string) => any;
	initialSelectedItemId?: string;
}

export const SelectedItemProvider: React.FC<SelectedItemProviderProps> = ({
	children,
	captureState,
	initialSelectedItemId,
}) => {
	const [selectedItemId, setSelectedItemId] = useState<string>(
		initialSelectedItemId || "",
	);
	const [selectedItemContent, setSelectedItemContent] = useState<any>({});
	const [initialItemState, setInitialItemState] = useState<any>(null);
	const [queue, setQueue] = useState<any[]>([]);
	const [itemsSubmitting, setItemsSubmitting] = useState<number>(0);

	useEffect(() => {
		let timeoutId: NodeJS.Timeout;
		const checkForChanges = () => {
			console.log(initialItemState);

			if (selectedItemId !== null && initialItemState !== null) {
				const currentState = captureState(selectedItemId);
				console.log(currentState);
				console.log(JSON.stringify(initialItemState));
				console.log(JSON.stringify(currentState));
				if (
					JSON.stringify(initialItemState) !== JSON.stringify(currentState) &&
					currentState !== null
				) {
					console.log(currentState);
					setQueue((prevQueue) => [...prevQueue, currentState]);
					setInitialItemState(currentState); // Update initial state to the current state
				}
			}
		};

		checkForChanges();

		// Set up an interval to run the check every 3 seconds
		const intervalId = setInterval(checkForChanges, 3000);

		// Clean up function to clear the interval when the component unmounts
		return () => clearInterval(intervalId);
	}, [selectedItemId, initialItemState, captureState]);

	const selectItem = useCallback(
		(itemId: string) => {
			if (selectedItemId !== null && initialItemState !== null) {
				const currentState = captureState(selectedItemId);
				if (
					JSON.stringify(initialItemState) !== JSON.stringify(currentState) &&
					currentState !== null
				) {
					console.log(currentState);
					setQueue((prevQueue) => [...prevQueue, currentState]);
				}
			}

			setSelectedItemId(itemId);
			setInitialItemState(captureState(itemId));
		},
		[selectedItemId, initialItemState, captureState],
	);

	const queueDeletion = (id: string) => {
		setQueue((prevQueue) => [...prevQueue, { type: "delete", data: { id } }]);
	};

	const queueNewField = (field: any) => {
		setQueue((prevQueue) => [...prevQueue, { type: "new", data: field }]);
	};

	const isSelected = useCallback(
		(id: string) => selectedItemId === id,
		[selectedItemId],
	);

	const submitQueue = () => {
		setItemsSubmitting(queue.length);
	};

	const updateQueueAfterSuccess = () => {
		// Remove first itemsSubmitting values from the queue
		setQueue((prevQueue) => prevQueue.slice(itemsSubmitting));
	};

	return (
		<SelectedItemContext.Provider
			value={{
				selectedItemId,
				setSelectedItemId: selectItem,
				isSelected,
				selectedItemContent,
				setSelectedItemContent,
				queue,
				queueDeletion,
				queueNewField,
				submitQueue,
				updateQueueAfterSuccess,
			}}
		>
			{children}
		</SelectedItemContext.Provider>
	);
};

export const useSelectedItem = (): SelectedItemContextType => {
	const context = useContext(SelectedItemContext);
	if (context === undefined) {
		throw new Error(
			"useSelectedItem must be used within a SelectedItemProvider",
		);
	}
	return context;
};
