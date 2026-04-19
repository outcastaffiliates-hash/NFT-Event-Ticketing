use soroban_sdk::{Env, Address, String, symbol_short};

/// Emits a contract event when a new event is created.
pub fn event_created(env: &Env, event_id: &String, organizer: &Address) {
    env.events().publish(
        (symbol_short!("created"),),
        (event_id.clone(), organizer.clone()),
    );
}

/// Emits a contract event when a ticket is minted.
pub fn ticket_minted(env: &Env, ticket_id: u64, event_id: &String, owner: &Address) {
    env.events().publish(
        (symbol_short!("minted"),),
        (ticket_id, event_id.clone(), owner.clone()),
    );
}

/// Emits a contract event when a ticket is used for check-in.
pub fn ticket_checked_in(env: &Env, ticket_id: u64, event_id: &String) {
    env.events().publish(
        (symbol_short!("checkin"),),
        (ticket_id, event_id.clone()),
    );
}

/// Emits a contract event when an event is deactivated.
pub fn event_deactivated(env: &Env, event_id: &String) {
    env.events().publish(
        (symbol_short!("deactiv"),),
        (event_id.clone(),),
    );
}
