package com.materialguardian.app.ui

import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import androidx.navigation.fragment.navArgs
import com.materialguardian.app.R
import com.materialguardian.app.databinding.FragmentMaterialBinding
import kotlinx.coroutines.launch
import java.text.DateFormat

class MaterialFragment : Fragment(R.layout.fragment_material) {

    private val args: MaterialFragmentArgs by navArgs()
    private val viewModel: MaterialViewModel by viewModels()
    private var _binding: FragmentMaterialBinding? = null
    private val binding get() = _binding!!

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        _binding = FragmentMaterialBinding.bind(view)
        binding.materialUpdateStatusButton.setOnClickListener {
            val status = binding.materialStatusInput.text?.toString().orEmpty()
            if (status.isNotBlank()) {
                viewModel.updateStatus(args.materialId, status)
            } else {
                Toast.makeText(requireContext(), R.string.material_status_hint, Toast.LENGTH_SHORT).show()
            }
        }
        collectState()
        viewModel.load(args.materialId)
    }

    private fun collectState() {
        viewLifecycleOwner.lifecycleScope.launch {
            viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.uiState.collect { state ->
                    binding.materialProgress.visibility = if (state.loading || state.updating) View.VISIBLE else View.GONE
                    binding.materialEmpty.visibility =
                        if (!state.loading && state.material == null) View.VISIBLE else View.GONE
                    state.material?.let { material ->
                        binding.materialId.text = getString(R.string.material_id, material.id)
                        binding.materialName.text = getString(R.string.material_name, material.name)
                        binding.materialQuantity.text = getString(R.string.material_quantity, material.quantity)
                        binding.materialStatus.text = getString(R.string.material_status, material.status)
                        val formattedDate = DateFormat.getDateTimeInstance().format(material.receivedAt.toDate())
                        binding.materialReceivedAt.text = getString(R.string.material_received_at, formattedDate)
                        binding.materialUserId.text = getString(R.string.material_user_id, material.userId)
                    }
                    state.error?.let {
                        Toast.makeText(requireContext(), it, Toast.LENGTH_SHORT).show()
                    }
                }
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
