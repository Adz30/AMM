import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import Card from "react-bootstrap/Card";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";
import Button from "react-bootstrap/Button";
import Row from "react-bootstrap/Row";
import DropdownItem from "react-bootstrap/esm/DropdownItem";
import Spinner from "react-bootstrap/Spinner";

import { ethers } from "ethers";

import Alert from "./Alert";

import { swap, loadBalances } from "../store/interactions";

const Swap = () => {
  const [inputToken, setInputToken] = useState(null);
  const [outputToken, setOutputToken] = useState(null);
  const [inputAmount, setInputAmount] = useState(0);
  const [outputAmount, setOutputAmount] = useState(0);

  const [price, setPrice] = useState(0);
  const [showAlert, setShowAlert] = useState(false);

  const provider = useSelector((state) => state.provider.connection);
  const account = useSelector((state) => state.provider.account);

  const tokens = useSelector((state) => state.tokens.contracts);
  const symbols = useSelector((state) => state.tokens.symbols);
  const balances = useSelector((state) => state.tokens.balances);

  const amm = useSelector((state) => state.amm.contract);
  const isSwapping = useSelector((state) => state.amm.swapping.isSwapping);
  const isSuccess = useSelector((state) => state.amm.swapping.isSuccess);
  const transactionHash = useSelector(
    (state) => state.amm.swapping.transactionHash
  );
  const dispatch = useDispatch();

  const inputHandler = async (e) => {
    if (!inputToken || !outputToken) {
      window.alert("Please select token");
      return;
    }
    if (inputToken === outputToken) {
      window.alert("Invalid token pair");
      return;
    }
    if (inputToken === "BMTK") {
      setInputAmount(e.target.value);

      const _token1Amount = ethers.utils.parseUnits(e.target.value, "ether");
      const result = await amm.calculateToken1Swap(_token1Amount);
      const _token2Amount = ethers.utils.formatUnits(result.toString(), "ether");

      setOutputAmount(_token2Amount.toString());
    } else {
      setInputAmount(e.target.value);

      const _token2Amount = ethers.utils.parseUnits(e.target.value, "ether");
      const result = await amm.calculateToken2Swap(_token2Amount);
      const _token1Amount = ethers.utils.formatUnits(result.toString(), "ether");

      setOutputAmount(_token1Amount.toString());
    }
  };

  const swapHandler = async (e) => {
    e.preventDefault();

    setShowAlert(false);

    if (inputToken === outputToken) {
      window.alert("Invalid token pair");
      return;
    }

    const _inputAmount = ethers.utils.parseUnits(inputAmount, "ether");

    if (inputToken === "BMTK") {
      await swap(provider, amm, tokens[0], inputToken, _inputAmount, dispatch);
    } else {
      await swap(provider, amm, tokens[1], inputToken, _inputAmount, dispatch);
    }

    await loadBalances(amm, tokens, account, dispatch);

    await getPrice();
  };

  const getPrice = async () => {
    if (inputToken === outputToken) {
      setPrice(0);
      return;
    }
    if (inputToken === "BMTK") {
      setPrice((await amm.token1Balance()) / (await amm.token2Balance()));
    } else {
      setPrice((await amm.token2Balance()) / (await amm.token1Balance()));
    }
  };

  useEffect(() => {
    if (inputToken && outputToken) {
      getPrice();
    }
  }, [inputToken, outputToken]);

  // Show alert when swap success/failure state changes
  useEffect(() => {
    if (typeof isSuccess === "boolean") {
      setShowAlert(true);

      const timer = setTimeout(() => setShowAlert(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess]);

  // Reset alert when tokens or input amount change
  useEffect(() => {
    setShowAlert(false);
  }, [inputToken, outputToken, inputAmount]);

  return (
    <div>
      <Card style={{ maxWidth: "450px" }} className="mx-auto px-4">
        {account ? (
          <>
            {/* Alert inside the card */}
            {isSwapping ? (
              <Alert
                message={"Swap Pending..."}
                transactionHash={null}
                variant={"info"}
                setShowAlert={setShowAlert}
                style={{ marginBottom: "1rem" }}
              />
            ) : isSuccess && showAlert ? (
              <Alert
                message={"Swap Successful"}
                transactionHash={transactionHash}
                variant={"success"}
                setShowAlert={setShowAlert}
                style={{ marginBottom: "1rem" }}
              />
            ) : !isSuccess && showAlert ? (
              <Alert
                message={"Swap Failed"}
                transactionHash={null}
                variant={"danger"}
                setShowAlert={setShowAlert}
                style={{ marginBottom: "1rem" }}
              />
            ) : null}

            <Form
              onSubmit={swapHandler}
              style={{ maxWidth: "450px", margin: "50px auto" }}
            >
              <Row className="my-3">
                <div className="d-flex justify-content-between">
                  <Form.Label>
                    <strong>Input:</strong>
                  </Form.Label>
                  <Form.Text muted>
                    Balance:{" "}
                    {inputToken === symbols[0]
                      ? balances[0]
                      : inputToken === symbols[1]
                      ? balances[1]
                      : 0}
                  </Form.Text>
                </div>
                <InputGroup>
                  <Form.Control
                    type="number"
                    placeholder="0.0"
                    min="0.0"
                    step="any"
                    onChange={(e) => inputHandler(e)}
                    disabled={!inputToken}
                  />
                  <DropdownButton
                    variant="outline-secondary"
                    title={inputToken ? inputToken : "Select Token"}
                  >
                    <DropdownItem onClick={(e) => setInputToken(e.target.innerHTML)}>
                      BMTK
                    </DropdownItem>
                    <DropdownItem onClick={(e) => setInputToken(e.target.innerHTML)}>
                      USD
                    </DropdownItem>
                  </DropdownButton>
                </InputGroup>
              </Row>

              <Row className="my-4">
                <div className="d-flex justify-content-between">
                  <Form.Label>
                    <strong>Output:</strong>
                  </Form.Label>
                  <Form.Text muted>
                    Balance:{" "}
                    {outputToken === symbols[0]
                      ? balances[0]
                      : outputToken === symbols[1]
                      ? balances[1]
                      : 0}
                  </Form.Text>
                </div>
                <InputGroup>
                  <Form.Control
                    type="number"
                    placeholder="0.0"
                    value={outputAmount === 0 ? "" : outputAmount}
                    disabled
                  />
                  <DropdownButton
                    variant="outline-secondary"
                    title={outputToken ? outputToken : "Select Token"}
                  >
                    <DropdownItem onClick={(e) => setOutputToken(e.target.innerHTML)}>
                      BMTK
                    </DropdownItem>
                    <DropdownItem onClick={(e) => setOutputToken(e.target.innerHTML)}>
                      USD
                    </DropdownItem>
                  </DropdownButton>
                </InputGroup>
              </Row>

              <Row className="my-3">
                {isSwapping ? (
                  <Spinner
                    animation="border"
                    style={{ display: "block", margin: "0 auto" }}
                  />
                ) : (
                  <Button type="submit">Swap</Button>
                )}

                <Form.Text muted>Exchange Rate: {price}</Form.Text>
              </Row>
            </Form>
          </>
        ) : (
          <p
            className="d-flex justify-content-center align-items-center"
            style={{ height: "300px" }}
          >
            Please connect wallet.
          </p>
        )}
      </Card>
    </div>
  );
};

export default Swap;
