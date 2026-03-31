from algopy import (
    ARC4Contract,
    Global,
    GlobalState,
    LocalState,
    String,
    Txn,
    UInt64,
    gtxn,
    itxn,
    op,
    subroutine,
)
from algopy.arc4 import abimethod


@subroutine
def _parse_outcome(outcome: String) -> UInt64:
    if outcome == "yes":
        return UInt64(1)
    if outcome == "no":
        return UInt64(2)
    assert False, "invalid outcome"


class ProbexContract(ARC4Contract):
    def __init__(self) -> None:
        self.total_yes_pool = GlobalState(UInt64(0))
        self.total_no_pool = GlobalState(UInt64(0))
        self.market_resolved = GlobalState(False)
        self.winning_outcome = GlobalState(UInt64(0))

        self.bet_amount = LocalState(UInt64)
        self.bet_outcome = LocalState(UInt64)
        self.claimed = LocalState(bool)

    @abimethod(allow_actions=["NoOp", "OptIn"])
    def bet(self, outcome: String, payment: gtxn.PaymentTransaction) -> None:
        assert not self.market_resolved.value, "market resolved"
        assert payment.receiver == Global.current_application_address, "bad receiver"
        assert payment.sender == Txn.sender, "bad sender"
        assert payment.amount > 0, "amount must be > 0"

        outcome_id = _parse_outcome(outcome)
        existing_bet, has_bet = self.bet_amount.maybe(Txn.sender)
        assert not has_bet, "already bet"

        self.bet_amount[Txn.sender] = payment.amount
        self.bet_outcome[Txn.sender] = outcome_id
        self.claimed[Txn.sender] = False

        if outcome_id == UInt64(1):
            self.total_yes_pool.value += payment.amount
        else:
            self.total_no_pool.value += payment.amount

    @abimethod
    def resolve_market(self, winning_outcome: String) -> None:
        assert Txn.sender == op.Global.creator_address, "only creator"
        assert not self.market_resolved.value, "already resolved"

        outcome_id = _parse_outcome(winning_outcome)
        self.winning_outcome.value = outcome_id
        self.market_resolved.value = True

    @abimethod
    def claim_winnings(self) -> None:
        assert self.market_resolved.value, "market not resolved"

        bet_amount, has_bet = self.bet_amount.maybe(Txn.sender)
        assert has_bet, "no bet"

        claimed, claimed_exists = self.claimed.maybe(Txn.sender)
        if claimed_exists:
            assert not claimed, "already claimed"

        outcome_id = self.bet_outcome[Txn.sender]
        assert outcome_id == self.winning_outcome.value, "not a winner"

        total_pool = self.total_yes_pool.value + self.total_no_pool.value
        if outcome_id == UInt64(1):
            winning_pool = self.total_yes_pool.value
        else:
            winning_pool = self.total_no_pool.value
        assert winning_pool > 0, "empty winning pool"

        payout = (bet_amount * total_pool) // winning_pool
        self.claimed[Txn.sender] = True

        itxn.Payment(
            receiver=Txn.sender,
            amount=payout,
            fee=0,
        ).submit()
