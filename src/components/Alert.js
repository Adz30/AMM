import { Alert as BootstrapAlert } from "react-bootstrap";

const Alert = ({ message, transactionHash, variant, setShowAlert }) => {
  return (
    <BootstrapAlert
      variant={variant}
      onClose={() => setShowAlert(false)}
      dismissible
      className="alert"
    >
      <p>{message}</p>

      {transactionHash && (
        <p>
          Tx Hash:{" "}
          <a
            href={`https://etherscan.io/tx/${transactionHash}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {transactionHash.slice(0, 6) + "..." + transactionHash.slice(-4)}
          </a>
        </p>
      )}
    </BootstrapAlert>
  );
};

export default Alert;