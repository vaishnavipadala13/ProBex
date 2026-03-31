import pytest
from algokit_utils import AlgoAmount, AlgorandClient, PaymentParams, SigningAccount


@pytest.fixture(scope="session")
def algorand() -> AlgorandClient:
    algorand_client = AlgorandClient.default_localnet()
    algorand_client.set_default_validity_window(1000)
    return algorand_client


@pytest.fixture(scope="session")
def dispenser(algorand: AlgorandClient) -> SigningAccount:
    return algorand.account.localnet_dispenser()


@pytest.fixture(scope="session")
def creator(algorand: AlgorandClient, dispenser: SigningAccount) -> SigningAccount:
    acct = algorand.account.random()
    algorand.send.payment(
        PaymentParams(
            sender=dispenser.address,
            receiver=acct.address,
            amount=AlgoAmount(algo=100),
        )
    )
    return acct


@pytest.fixture(scope="session")
def bettor_a(algorand: AlgorandClient, dispenser: SigningAccount) -> SigningAccount:
    acct = algorand.account.random()
    algorand.send.payment(
        PaymentParams(
            sender=dispenser.address,
            receiver=acct.address,
            amount=AlgoAmount(algo=20),
        )
    )
    return acct


@pytest.fixture(scope="session")
def bettor_b(algorand: AlgorandClient, dispenser: SigningAccount) -> SigningAccount:
    acct = algorand.account.random()
    algorand.send.payment(
        PaymentParams(
            sender=dispenser.address,
            receiver=acct.address,
            amount=AlgoAmount(algo=20),
        )
    )
    return acct


def _fund(algorand: AlgorandClient, dispenser: SigningAccount, algo: int = 50) -> SigningAccount:
    acct = algorand.account.random()
    algorand.send.payment(
        PaymentParams(
            sender=dispenser.address,
            receiver=acct.address,
            amount=AlgoAmount(algo=algo),
        )
    )
    return acct
