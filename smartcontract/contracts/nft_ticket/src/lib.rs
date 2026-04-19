#![no_std]

mod types;
mod errors;
mod events;
mod storage;
mod ticket;

pub use crate::ticket::NFTTicketContract;
