package com.materialguardian.app.ui

import android.os.Bundle
import android.view.View
import androidx.fragment.app.Fragment
import androidx.fragment.app.viewModels
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import androidx.navigation.fragment.navArgs
import androidx.recyclerview.widget.LinearLayoutManager
import com.materialguardian.app.R
import com.materialguardian.app.databinding.FragmentJobDetailBinding
import com.materialguardian.app.MaterialItem
import com.materialguardian.app.MaterialRepository
import kotlinx.coroutines.launch
import java.text.DateFormat

class JobDetailFragment : Fragment(R.layout.fragment_job_detail) {

    private val args: JobDetailFragmentArgs by navArgs()
    private val viewModel: JobDetailViewModel by viewModels()
    private val materialsAdapter = MaterialsAdapter { material ->
        val action = JobDetailFragmentDirections.actionJobDetailFragmentToMaterialFragment(material.id)
        findNavController().navigate(action)
    }
    private val materialRepository = MaterialRepository()
    private var _binding: FragmentJobDetailBinding? = null
    private val binding get() = _binding!!

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        _binding = FragmentJobDetailBinding.bind(view)
        binding.materialsRecycler.layoutManager = LinearLayoutManager(requireContext())
        binding.materialsRecycler.adapter = materialsAdapter
        binding.materialsAddFab.setOnClickListener { showMaterialForm(args.jobNumber) }
        collectState()
        viewModel.load(args.jobNumber)
        collectMaterials()
    }

    private fun collectState() {
        viewLifecycleOwner.lifecycleScope.launch {
            viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.uiState.collect { state ->
                    binding.jobDetailProgress.visibility = if (state.loading) View.VISIBLE else View.GONE
                    binding.jobDetailEmpty.visibility =
                        if (!state.loading && state.job == null) View.VISIBLE else View.GONE
                    state.job?.let { job ->
                        binding.jobNumber.text = getString(R.string.job_detail_number, job.jobNumber)
                        binding.jobDescription.text = getString(R.string.job_detail_description, job.description)
                        binding.jobNotes.text = getString(R.string.job_detail_notes, job.notes)
                        val formattedDate = DateFormat.getDateTimeInstance().format(job.createdAt.toDate())
                        binding.jobCreatedAt.text = getString(R.string.job_detail_created_at, formattedDate)
                    }
                }
            }
        }
    }

    private fun collectMaterials() {
        viewLifecycleOwner.lifecycleScope.launch {
            materialRepository.streamMaterialsForJob(args.jobNumber).collect { items ->
                binding.materialsEmpty.visibility = if (items.isEmpty()) View.VISIBLE else View.GONE
                materialsAdapter.submitList(items)
            }
        }
    }

    private fun showMaterialForm(jobNumber: String) {
        val dialogView = layoutInflater.inflate(R.layout.bottom_sheet_material_form, null)
        val name = dialogView.findViewById<android.widget.EditText>(R.id.materialFormName)
        val quantity = dialogView.findViewById<android.widget.EditText>(R.id.materialFormQuantity)
        val status = dialogView.findViewById<android.widget.EditText>(R.id.materialFormStatus)
        val saveButton = dialogView.findViewById<android.widget.Button>(R.id.materialFormSave)
        val dialog = com.google.android.material.bottomsheet.BottomSheetDialog(requireContext())
        dialog.setContentView(dialogView)
        saveButton.setOnClickListener {
            val nameVal = name.text?.toString()?.trim().orEmpty()
            val qtyVal = quantity.text?.toString()?.trim().orEmpty().toIntOrNull() ?: 0
            val statusVal = status.text?.toString()?.trim().orEmpty()
            if (nameVal.isBlank()) {
                Toast.makeText(requireContext(), R.string.material_form_name_required, Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            viewLifecycleOwner.lifecycleScope.launch {
                materialRepository.addMaterial(
                    MaterialItem(
                        jobNumber = jobNumber,
                        name = nameVal,
                        quantity = qtyVal,
                        status = statusVal
                    )
                )
                dialog.dismiss()
            }
        }
        dialog.show()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}
