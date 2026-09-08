# Legacy Besu Genesis

`genesis.json` in this directory belongs to the former single-node Clique/development
configuration (chain ID `1337`). It is retained only as historical reference and must not be used
by the QBFT deployment workflow.

The active local/runtime configuration is the generated QBFT network under
`networks/local-qbft/generated/`, provisioned with validator keys outside Git. Production servers
must provision and persist their own QBFT genesis and node keys; they must not receive them from a
source-control checkout.
