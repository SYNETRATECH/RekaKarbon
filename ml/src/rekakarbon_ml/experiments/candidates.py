"""
Anomaly Detector Candidate Registry for the Model Benchmark.

Provides a uniform ``DetectorAdapter`` interface around statistical, classical
machine-learning, and deep-learning detectors so the benchmark harness can compare
them fairly. All candidates (core scikit-learn/scipy statistics, PyOD classical
detectors, and PyOD deep-learning detectors on torch) run in every benchmark
because ``pyod`` and ``torch`` are required project dependencies.

Higher ``score_samples`` means more anomalous for every detector.
"""

import inspect
import math
from dataclasses import dataclass
from typing import Any, Callable, Dict, List, Optional

import numpy as np
from sklearn.covariance import EllipticEnvelope
from sklearn.decomposition import PCA
from sklearn.ensemble import GradientBoostingClassifier, IsolationForest
from sklearn.mixture import GaussianMixture
from sklearn.neighbors import LocalOutlierFactor
from sklearn.preprocessing import RobustScaler

EPB: float = 1e-10


@dataclass(frozen=True)
class CandidateInfo:
    """Static metadata describing a detector candidate."""

    name: str
    family: str  # baseline | statistical | ml | supervised | dl
    onnx_exportable: bool
    requires: str  # core (all dependents are required project dependencies)
    description: str


class DetectorAdapter:
    """
    Uniform wrapper that converts raw feature matrices into anomaly scores.

    Subclasses implement ``_fit`` and ``_score_samples``; binary predictions are
    derived by thresholding scores at the contamination quantile by the caller.
    """

    name: str = "detector"
    info: CandidateInfo

    def __init__(self, random_state: int | None = None):
        self.random_state = random_state
        self.contamination: float = 0.15
        self._fitted: bool = False

    def fit(self, X: np.ndarray, y: Optional[np.ndarray] = None) -> "DetectorAdapter":
        X = np.asarray(X, dtype=float)
        self._fit(X, y)
        self._fitted = True
        return self

    def _fit(self, X: np.ndarray, y: Optional[np.ndarray]) -> None:
        raise NotImplementedError

    def score_samples(self, X: np.ndarray) -> np.ndarray:
        if not self._fitted:
            raise RuntimeError(f"{self.name} must be fitted before scoring")
        X = np.asarray(X, dtype=float)
        return np.asarray(self._score_samples(X), dtype=float)

    def _score_samples(self, X: np.ndarray) -> np.ndarray:
        raise NotImplementedError

    def predict(self, X: np.ndarray, threshold: float | None = None) -> np.ndarray:
        scores = self.score_samples(X)
        if threshold is None:
            raise ValueError("threshold required for binary prediction")
        return (scores >= threshold).astype(int)


class RobustZScoreDetector(DetectorAdapter):
    """
    Statistical detector: maximum per-feature (x - median) / (1.4826 * MAD) z-score.
    Heightening across features reveals extreme unilateral underreporting.
    """

    name: str = "robust_zscore"
    info: CandidateInfo = CandidateInfo(
        name="robust_zscore",
        family="statistical",
        onnx_exportable=False,
        requires="core",
        description="Maximum per-feature MAD-based robust z-score (statistical)",
    )

    def __init__(self, random_state: int | None = None):
        super().__init__(random_state)
        self.medians: np.ndarray = np.empty(0)
        self.mads: np.ndarray = np.empty(0)

    def _fit(self, X: np.ndarray, y: Optional[np.ndarray]) -> None:
        self.medians = np.median(X, axis=0)
        self.mads = np.median(np.abs(X - self.medians), axis=0) * 1.4826
        self.mads = np.maximum(self.mads, EPB)

    def _score_samples(self, X: np.ndarray) -> np.ndarray:
        z = np.abs((X - self.medians) / self.mads)
        return np.max(z, axis=1)


class IsolationForestDetector(DetectorAdapter):
    """Baseline: the production RobustScaler + IsolationForest pipeline (sklearn)."""

    name: str = "isolation_forest"
    info: CandidateInfo = CandidateInfo(
        name="isolation_forest",
        family="baseline",
        onnx_exportable=True,
        requires="core",
        description="Production baseline: RobustScaler + IsolationForest (ONNX-served)",
    )
    scaler: Optional[RobustScaler] = None
    model: Optional[IsolationForest] = None

    def _fit(self, X: np.ndarray, y: Optional[np.ndarray]) -> None:
        self.scaler = RobustScaler()
        X_s = self.scaler.fit_transform(X)
        self.model = IsolationForest(
            n_estimators=100,
            contamination=self.contamination,
            random_state=self.random_state,
        ).fit(X_s)

    def _score_samples(self, X: np.ndarray) -> np.ndarray:
        if self.model is None or self.scaler is None:
            raise RuntimeError(f"{self.name} was not fitted")
        X_s = self.scaler.transform(X)
        return -self.model.decision_function(X_s)


class EllipticEnvelopeDetector(DetectorAdapter):
    """Statistical: minimum covariance determinant (MCD) Mahalanobis anomaly score."""

    name: str = "elliptic_envelope"
    info: CandidateInfo = CandidateInfo(
        name="elliptic_envelope",
        family="statistical",
        onnx_exportable=False,
        requires="core",
        description="MCD Mahalanobis distance (EllipticEnvelope)",
    )
    model: Optional[EllipticEnvelope] = None

    def _fit(self, X: np.ndarray, y: Optional[np.ndarray]) -> None:
        self.model = EllipticEnvelope(
            contamination=self.contamination,
            random_state=self.random_state,
        ).fit(X)

    def _score_samples(self, X: np.ndarray) -> np.ndarray:
        if self.model is None:
            raise RuntimeError(f"{self.name} was not fitted")
        return -self.model.decision_function(X)


class PcaQResidualDetector(DetectorAdapter):
    """Statistical: PCA reconstruction Q-residual (squared projection error)."""

    name: str = "pca_qresidual"
    info: CandidateInfo = CandidateInfo(
        name="pca_qresidual",
        family="statistical",
        onnx_exportable=True,
        requires="core",
        description="PCA reconstruction Q-residual (sklearn, ONNX-exportable)",
    )
    model: Optional[PCA] = None

    def _fit(self, X: np.ndarray, y: Optional[np.ndarray]) -> None:
        n_comp = min(10, int(X.shape[1]))
        self.model = PCA(n_components=n_comp, random_state=self.random_state).fit(X)
        if not np.all(np.isfinite(self.model.components_)):
            self.model = PCA(n_components=2, random_state=self.random_state).fit(X)

    def _score_samples(self, X: np.ndarray) -> np.ndarray:
        if self.model is None:
            raise RuntimeError(f"{self.name} was not fitted")
        recon = self.model.inverse_transform(self.model.transform(X))
        return np.sum((X - recon) ** 2, axis=1)


class GaussianMixtureDetector(DetectorAdapter):
    """Statistical: negative log-likelihood under a GaussianMixture density model."""

    name: str = "gaussian_mixture"
    info: CandidateInfo = CandidateInfo(
        name="gaussian_mixture",
        family="statistical",
        onnx_exportable=False,
        requires="core",
        description="Negative log-likelihood (GaussianMixture density)",
    )
    model: Optional[GaussianMixture] = None

    def _fit(self, X: np.ndarray, y: Optional[np.ndarray]) -> None:
        self.model = GaussianMixture(
            n_components=3,
            covariance_type="full",
            random_state=self.random_state,
        ).fit(X)

    def _score_samples(self, X: np.ndarray) -> np.ndarray:
        if self.model is None:
            raise RuntimeError(f"{self.name} was not fitted")
        return -self.model.score_samples(X)


class LofDetector(DetectorAdapter):
    """Machine learning: Local Outlier Factor (k-neighborhood reachability)."""

    name: str = "lof"
    info: CandidateInfo = CandidateInfo(
        name="lof",
        family="ml",
        onnx_exportable=False,
        requires="core",
        description="Local Outlier Factor (sklearn)",
    )
    model: Optional[LocalOutlierFactor] = None

    def _fit(self, X: np.ndarray, y: Optional[np.ndarray]) -> None:
        self.model = LocalOutlierFactor(
            contamination=self.contamination,
            novelty=True,
            n_neighbors=20,
        ).fit(X)

    def _score_samples(self, X: np.ndarray) -> np.ndarray:
        if self.model is None:
            raise RuntimeError(f"{self.name} was not fitted")
        return -self.model.decision_function(X)


class HistogramOutlierScoreDetector(DetectorAdapter):
    """
    Statistical histogram-based outlier score (HBOS, Goldstein & Dengel 2012).

    Pure NumPy implementation so the benchmark does not depend on PyOD for the
    histogram detector. Each feature is binned; anomaly score is the negative log
    expectation of the joint histogram density.
    """

    name: str = "hbos"
    info: CandidateInfo = CandidateInfo(
        name="hbos",
        family="statistical",
        onnx_exportable=False,
        requires="core",
        description="Histogram-based Outlier Score (pure NumPy)",
    )

    def __init__(self, random_state: int | None = None, n_bins: int = 10):
        super().__init__(random_state)
        self.n_bins = n_bins
        self.edges: List[np.ndarray] = []
        self.probs: List[np.ndarray] = []

    def _fit(self, X: np.ndarray, y: Optional[np.ndarray]) -> None:
        self.edges = []
        self.probs = []
        for j in range(X.shape[1]):
            col = X[:, j]
            lo, hi = float(np.min(col)), float(np.max(col))
            if hi - lo < EPB:
                options = np.array([-1.0, 0.0, 1.0])
                col = np.concatenate([col, options])
                lo, hi = float(np.min(col)), float(np.max(col))
            counts, edges = np.histogram(col, bins=self.n_bins, range=(lo, hi))
            probs = (counts + 1.0) / (float(counts.sum()) + self.n_bins)
            self.edges.append(edges)
            self.probs.append(probs)

    def _score_samples(self, X: np.ndarray) -> np.ndarray:
        scores = np.zeros(X.shape[0])
        for j in range(X.shape[1]):
            edges = self.edges[j]
            probs = self.probs[j]
            for i in range(X.shape[0]):
                b = int(np.searchsorted(edges, X[i, j], side="right") - 1)
                b = min(max(b, 0), self.n_bins - 1)
                scores[i] += -math.log(max(probs[b], EPB))
        return scores


class GradientBoostingCeilingDetector(DetectorAdapter):
    """
    Supervised ceiling: GradientBoosting classifier trained on ground-truth anomaly
    labels. Diagnostic only (never production): establishes the supervised upper
    boundary for unsupervised methods to approximate.
    """

    name: str = "gradient_boosting_ceiling"
    info: CandidateInfo = CandidateInfo(
        name="gradient_boosting_ceiling",
        family="supervised",
        onnx_exportable=True,
        requires="core",
        description="Supervised diagnostic ceiling: GradientBoosting on labels",
    )
    model: Optional[GradientBoostingClassifier] = None

    def _fit(self, X: np.ndarray, y: Optional[np.ndarray]) -> None:
        if y is None:
            raise ValueError("gradient_boosting_ceiling requires y labels")
        y_bin = self._binarize_labels(y)
        self.model = GradientBoostingClassifier(
            n_estimators=100,
            max_depth=3,
            learning_rate=0.1,
            random_state=self.random_state,
        ).fit(X, y_bin)

    @staticmethod
    def _binarize_labels(y: np.ndarray) -> np.ndarray:
        return (np.asarray(y) == 1).astype(int)

    def _score_samples(self, X: np.ndarray) -> np.ndarray:
        if self.model is None:
            raise RuntimeError(f"{self.name} was not fitted")
        return self.model.predict_proba(X)[:, 1]


class PyodDetector(DetectorAdapter):
    """Generic adapter for PyOD estimators (pyod is a required project dependency)."""

    name: str = "pyod"
    info: CandidateInfo = CandidateInfo(
        name="pyod",
        family="ml",
        onnx_exportable=False,
        requires="core",
        description="PyOD-backed detector",
    )

    def __init__(self, pyod_class: Any, model_kwargs: Optional[Dict[str, Any]] = None):
        super().__init__(random_state=None)
        self.pyod_class = pyod_class
        self.model_kwargs = model_kwargs or {}
        self.model: Any = None
        self._accepts_random_state = _signature_has(self.pyod_class.__init__, "random_state")
        self._requires_n_features = _signature_requires(self.pyod_class.__init__, "n_features")

    def _fit(self, X: np.ndarray, y: Optional[np.ndarray]) -> None:
        kwargs: Dict[str, Any] = dict(self.model_kwargs)
        if self._requires_n_features and "n_features" not in kwargs:
            kwargs["n_features"] = int(X.shape[1])
        if self._accepts_random_state and "random_state" not in kwargs:
            kwargs["random_state"] = self.random_state
        self.model = self.pyod_class(
            contamination=self.contamination,
            **kwargs,
        )
        self.model.fit(X)

    def _score_samples(self, X: np.ndarray) -> np.ndarray:
        if self.model is None:
            raise RuntimeError(f"{self.name} was not fitted")
        return -self.model.decision_function(X)


def _signature_has(callable_obj: Any, param_name: str) -> bool:
    try:
        return param_name in inspect.signature(callable_obj).parameters
    except (TypeError, ValueError):
        return False


def _signature_requires(callable_obj: Any, param_name: str) -> bool:
    try:
        sig = inspect.signature(callable_obj)
    except (TypeError, ValueError):
        return False
    if param_name not in sig.parameters:
        return False
    return sig.parameters[param_name].default is inspect.Parameter.empty


def _build_pyod_factory(
    pyod_class: Any,
    name: str,
    family: str,
    description: str,
    model_kwargs: Optional[Dict[str, Any]] = None,
) -> Callable[[int | None], DetectorAdapter]:
    def factory(random_state: int | None = None) -> DetectorAdapter:
        det = PyodDetector(pyod_class=pyod_class, model_kwargs=model_kwargs)
        det.random_state = random_state
        det.name = name
        det.info = CandidateInfo(
            name=name,
            family=family,
            onnx_exportable=False,
            requires="core",
            description=description,
        )
        return det

    return factory


CANDIDATE_FACTORIES: Dict[str, Callable[[int | None], DetectorAdapter]] = {
    "isolation_forest": lambda rs: IsolationForestDetector(random_state=rs),
    "robust_zscore": lambda rs: RobustZScoreDetector(random_state=rs),
    "elliptic_envelope": lambda rs: EllipticEnvelopeDetector(random_state=rs),
    "pca_qresidual": lambda rs: PcaQResidualDetector(random_state=rs),
    "gaussian_mixture": lambda rs: GaussianMixtureDetector(random_state=rs),
    "lof": lambda rs: LofDetector(random_state=rs),
    "hbos": lambda rs: HistogramOutlierScoreDetector(random_state=rs),
    "gradient_boosting_ceiling": lambda rs: GradientBoostingCeilingDetector(random_state=rs),
}


def _register_pyod_candidates() -> None:
    """Registers PyOD-backed detectors when the 'bench' extra is installed."""
    try:
        from pyod.models.auto_encoder import AutoEncoder
        from pyod.models.copod import COPOD
        from pyod.models.deep_svdd import DeepSVDD
        from pyod.models.ecod import ECOD
        from pyod.models.iforest import IForest
        from pyod.models.vae import VAE
    except ImportError:
        return

    CANDIDATE_FACTORIES["copod"] = _build_pyod_factory(
        COPOD,
        name="copod",
        family="ml",
        description="Copula-based Outlier Detection (PyOD)",
    )
    CANDIDATE_FACTORIES["ecod"] = _build_pyod_factory(
        ECOD,
        name="ecod",
        family="ml",
        description="Empirical Cumulative Distribution Outlier Detection (PyOD)",
    )
    CANDIDATE_FACTORIES["iforest_pyod"] = _build_pyod_factory(
        IForest,
        name="iforest_pyod",
        family="ml",
        description="Isolation Forest (PyOD implementation)",
    )

    try:
        import torch  # noqa: F401

        CANDIDATE_FACTORIES["autoencoder_dl"] = _build_pyod_factory(
            AutoEncoder,
            name="autoencoder_dl",
            family="dl",
            description="Reconstruction-error AutoEncoder (PyOD + torch)",
            model_kwargs={
                "hidden_neuron_list": [32, 16, 32],
                "epoch_num": 20,
                "batch_size": 128,
                "preprocessing": False,
                "verbose": 0,
            },
        )
        CANDIDATE_FACTORIES["vae_dl"] = _build_pyod_factory(
            VAE,
            name="vae_dl",
            family="dl",
            description="Variational AutoEncoder (PyOD + torch)",
            model_kwargs={
                "encoder_neuron_list": [32, 16],
                "decoder_neuron_list": [16, 32],
                "epoch_num": 20,
                "batch_size": 128,
                "preprocessing": False,
                "verbose": 0,
            },
        )
        CANDIDATE_FACTORIES["deep_svdd_dl"] = _build_pyod_factory(
            DeepSVDD,
            name="deep_svdd_dl",
            family="dl",
            description="Deep Support Vector Data Description (PyOD + torch)",
            model_kwargs={
                "hidden_neurons": [32, 32],
                "epochs": 20,
                "batch_size": 128,
                "preprocessing": False,
                "verbose": 0,
            },
        )
    except ImportError:
        pass


_register_pyod_candidates()


def available_candidates() -> List[CandidateInfo]:
    """Returns metadata for detectors currently importable in this runtime."""
    return [factory(None).info for factory in CANDIDATE_FACTORIES.values()]


def build_candidate(name: str, random_state: int | None = None) -> DetectorAdapter:
    """Instantiates a fresh, unfitted candidate detector by name."""
    if name not in CANDIDATE_FACTORIES:
        raise KeyError(f"Unknown candidate '{name}'. Available: {sorted(CANDIDATE_FACTORIES)}")
    return CANDIDATE_FACTORIES[name](random_state)
