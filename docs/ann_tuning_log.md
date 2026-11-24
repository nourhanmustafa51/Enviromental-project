# ANN Hyperparameter Tuning Log
**Owner:** Member 4 (Deep Learning and Hybrid Engineer)

- **Framework:** PyTorch (Adam optimizer, MSE loss, ReLU hidden activations, linear output, Early Stopping patience=20)
- **Best Configuration:** `{'name': 'mlp_128_64_32_lowdrop', 'hidden_dims': [128, 64, 32], 'lr': 0.0005, 'dropout': 0.1, 'batch_size': 32, 'weight_decay': 0.0005}` (Best Epoch: 70 / 90)

| config | hidden_dims | lr | dropout | batch_size | weight_decay | epochs_run | best_epoch | val_r2 | val_rmse | val_mae | time_s |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| mlp_128_64_32_lowdrop | [128, 64, 32] | 0.0005 | 0.1 | 32 | 0.0005 | 90 | 70 | 0.6098 | 1.0486 | 0.6975 | 16.82 |
| mlp_128_64_32 | [128, 64, 32] | 0.001 | 0.2 | 64 | 0.0001 | 90 | 70 | 0.5815 | 1.0859 | 0.7244 | 10.25 |
| mlp_256_128_64_lr5e4 | [256, 128, 64] | 0.0005 | 0.2 | 32 | 0.0001 | 69 | 49 | 0.5777 | 1.0908 | 0.7209 | 15.4 |
| baseline_64_32 | [64, 32] | 0.001 | 0.1 | 64 | 0.0001 | 99 | 79 | 0.5772 | 1.0915 | 0.7631 | 8.88 |
| mlp_128_64 | [128, 64] | 0.001 | 0.15 | 64 | 0.0001 | 56 | 36 | 0.5496 | 1.1265 | 0.7723 | 5.69 |
| mlp_64_32_16_lr5e4 | [64, 32, 16] | 0.0005 | 0.1 | 32 | 0.0001 | 65 | 45 | 0.5331 | 1.147 | 0.8122 | 11.23 |
