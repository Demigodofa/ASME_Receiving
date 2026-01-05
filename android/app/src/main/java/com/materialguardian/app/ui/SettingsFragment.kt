package com.materialguardian.app.ui

import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.core.widget.doAfterTextChanged
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import com.materialguardian.app.R
import com.materialguardian.app.databinding.FragmentSettingsBinding
import kotlinx.coroutines.launch

class SettingsFragment : Fragment(R.layout.fragment_settings) {

    private val viewModel: SettingsViewModel by viewModels()
    private var _binding: FragmentSettingsBinding? = null
    private val binding get() = _binding!!

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        _binding = FragmentSettingsBinding.bind(view)

        binding.cloudSaveButton.setOnClickListener {
            viewModel.updateCloudSettings(
                firebaseConfig = binding.cloudFirebaseConfig.text?.toString().orEmpty(),
                pdfEndpoint = binding.cloudPdfEndpoint.text?.toString().orEmpty(),
                enabled = binding.cloudToggle.isChecked
            )
            Toast.makeText(requireContext(), R.string.settings_saved_placeholder, Toast.LENGTH_SHORT).show()
        }

        // Simple live preview of JSON length / toggles could be added later
        binding.cloudFirebaseConfig.doAfterTextChanged { }
        binding.cloudPdfEndpoint.doAfterTextChanged { }
        binding.cloudToggle.setOnCheckedChangeListener { _, _ -> }

        collectState()
    }

    private fun collectState() {
        viewLifecycleOwner.lifecycleScope.launch {
            viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.uiState.collect { state ->
                    binding.cloudFirebaseConfig.setText(state.cloudSettings.firebaseConfigJson)
                    binding.cloudPdfEndpoint.setText(state.cloudSettings.pdfEndpoint)
                    binding.cloudToggle.isChecked = state.cloudSettings.cloudModeEnabled
                }
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
