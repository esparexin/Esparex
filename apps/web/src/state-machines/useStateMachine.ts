import { useState, useCallback } from 'react';
import { MachineConfig, MachineState, MachineEvent } from './machineTypes';

export function useStateMachine<S extends MachineState, E extends MachineEvent>(
    machine: MachineConfig<S, E>
) {
    const [state, setState] = useState<S>(machine.initial);

    const send = useCallback(
        (event: E) => {
            setState((currentState) => {
                const nextState = machine.states[currentState]?.on?.[event];
                if (nextState) {
                    return nextState as S;
                }
                if (process.env.NODE_ENV === 'development') {
                    console.warn(`[StateMachine] Invalid transition: ${currentState} -> ${String(event)}`);
                }
                return currentState;
            });
        },
        [machine]
    );

    return { state, send };
}
